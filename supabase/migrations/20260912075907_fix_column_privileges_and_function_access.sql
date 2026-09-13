/*
# Fix Column-Level Privileges and Function Access

## Overview
1. Properly restrict which profile columns the authenticated role can UPDATE.
   The previous migration used REVOKE UPDATE (col) FROM authenticated, but the
   table-level GRANT UPDATE still covered all columns. The correct approach is:
   REVOKE UPDATE on the table, then GRANT UPDATE only on user-editable columns.
2. Revoke EXECUTE on the internal `award_xp` function from anon/public — it is
   only called server-side by `complete_quest`, never directly by the client.

## Changes
- REVOKE UPDATE ON profiles FROM authenticated
- GRANT UPDATE (username, character_class) ON profiles TO authenticated
- REVOKE EXECUTE ON FUNCTION award_xp FROM PUBLIC, anon
*/

-- ============================================================
-- Column-level privileges: restrict UPDATE to user-editable columns only
-- ============================================================
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (username, character_class) ON profiles TO authenticated;

-- ============================================================
-- Revoke direct access to internal award_xp function
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, integer) FROM anon;

-- ============================================================
-- QUEST ENGINE + REWARD ENGINE
-- ============================================================
-- The original schema already contains quests, quest logs, profiles, XP,
-- coins, streaks, attributes, and titles. This migration extends those
-- systems rather than introducing parallel progression tables.

ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS focused_at timestamptz;

ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS quests_status_check;

ALTER TABLE public.quests
  ADD CONSTRAINT quests_status_check
  CHECK (status IN ('active', 'started', 'focused', 'completed', 'abandoned'));

ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS quests_estimated_duration_check;

ALTER TABLE public.quests
  ADD CONSTRAINT quests_estimated_duration_check
  CHECK (estimated_duration_minutes BETWEEN 1 AND 1440);

CREATE INDEX IF NOT EXISTS idx_quests_user_status_created
  ON public.quests(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quests_user_due_date
  ON public.quests(user_id, due_date);

-- Keep completion history when a user removes the original quest.
ALTER TABLE public.quest_logs
  DROP CONSTRAINT IF EXISTS quest_logs_quest_id_fkey;

ALTER TABLE public.quest_logs
  ADD CONSTRAINT quest_logs_quest_id_fkey
  FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE SET NULL;

-- Reward definitions are data-owned by the database. Clients can select a
-- difficulty, but they can never submit an XP or coin amount.
CREATE OR REPLACE FUNCTION public.quest_xp_for(
  p_difficulty text,
  p_duration_minutes integer
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    CASE p_difficulty
      WHEN 'trivial' THEN 5
      WHEN 'easy' THEN 10
      WHEN 'normal' THEN 25
      WHEN 'hard' THEN 50
      WHEN 'epic' THEN 100
      ELSE 10
    END
    + LEAST(10, GREATEST(0, FLOOR(GREATEST(15, p_duration_minutes) / 30.0)::integer))
  )::integer;
$$;

CREATE OR REPLACE FUNCTION public.set_quest_reward()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.xp_reward := public.quest_xp_for(NEW.difficulty, NEW.estimated_duration_minutes);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_quest_reward_on_write ON public.quests;
CREATE TRIGGER set_quest_reward_on_write
  BEFORE INSERT OR UPDATE OF difficulty, estimated_duration_minutes ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.set_quest_reward();

-- Achievement definitions are immutable app data. User unlocks are append-only
-- and are written only by complete_quest inside the same transaction.
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  requirement_type text NOT NULL CHECK (requirement_type IN ('quests', 'streak', 'level', 'xp')),
  threshold integer NOT NULL CHECK (threshold > 0)
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_achievement_definitions" ON public.achievement_definitions;
CREATE POLICY "select_achievement_definitions" ON public.achievement_definitions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "select_own_user_achievements" ON public.user_achievements;
CREATE POLICY "select_own_user_achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.achievement_definitions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.quest_logs FROM authenticated;

INSERT INTO public.achievement_definitions (code, name, description, requirement_type, threshold)
VALUES
  ('first_quest', 'First Blood', 'Complete your first quest.', 'quests', 1),
  ('ten_quests', 'Quest Runner', 'Complete ten quests.', 'quests', 10),
  ('seven_day_streak', 'On Fire', 'Reach a seven-day completion streak.', 'streak', 7),
  ('level_five', 'Seasoned', 'Reach level five.', 'level', 5),
  ('thousand_xp', 'Rising Force', 'Earn 1,000 lifetime XP.', 'xp', 1000)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type,
  threshold = EXCLUDED.threshold;

-- Lifecycle functions are the only way the browser can move a quest between
-- states. Locking the row makes simultaneous requests deterministic.
CREATE OR REPLACE FUNCTION public.start_quest(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quest public.quests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND OR v_quest.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Quest not found');
  END IF;

  IF v_quest.status <> 'active' THEN
    RETURN jsonb_build_object('error', 'Only an active quest can be started');
  END IF;

  UPDATE public.quests
  SET status = 'started', started_at = COALESCE(started_at, now())
  WHERE id = p_quest_id;

  RETURN jsonb_build_object('success', true, 'status', 'started');
END;
$$;

CREATE OR REPLACE FUNCTION public.focus_quest(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quest public.quests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND OR v_quest.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Quest not found');
  END IF;

  IF v_quest.status NOT IN ('active', 'started', 'focused') THEN
    RETURN jsonb_build_object('error', 'Only an active quest can enter focus mode');
  END IF;

  UPDATE public.quests
  SET status = 'focused',
      started_at = COALESCE(started_at, now()),
      focused_at = COALESCE(focused_at, now())
  WHERE id = p_quest_id;

  RETURN jsonb_build_object('success', true, 'status', 'focused');
END;
$$;

CREATE OR REPLACE FUNCTION public.abandon_quest(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quest public.quests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND OR v_quest.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Quest not found');
  END IF;

  IF v_quest.status IN ('completed', 'abandoned') THEN
    RETURN jsonb_build_object('error', 'Quest is already closed');
  END IF;

  UPDATE public.quests SET status = 'abandoned' WHERE id = p_quest_id;
  RETURN jsonb_build_object('success', true, 'status', 'abandoned');
END;
$$;

-- Replaces the earlier completion function with an idempotent, locked,
-- server-calculated reward transaction. A second completion request sees the
-- terminal status and cannot award anything.
CREATE OR REPLACE FUNCTION public.complete_quest(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quest public.quests%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_progression jsonb;
  v_xp integer;
  v_coins integer;
  v_attribute_key text;
  v_attribute_gained integer := 1;
  v_attribute_previous_value integer;
  v_new_value integer;
  v_level_before integer;
  v_streak_before integer;
  v_old_titles text[];
  v_all_titles text[];
  v_new_titles text[] := ARRAY[]::text[];
  v_titles_unlocked text[] := ARRAY[]::text[];
  v_achievement_unlocks jsonb := '[]'::jsonb;
  v_completed_at timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id
  FOR UPDATE;

  IF NOT FOUND OR v_quest.user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Quest not found');
  END IF;

  IF v_quest.status NOT IN ('active', 'started', 'focused') THEN
    RETURN jsonb_build_object('error', 'Quest is already completed or closed');
  END IF;

  -- These values come only from trusted database functions and quest fields.
  v_xp := public.quest_xp_for(v_quest.difficulty, v_quest.estimated_duration_minutes);
  v_coins := GREATEST(1, CEIL(v_xp / 5.0)::integer);
  v_attribute_key := CASE
    WHEN lower(v_quest.category) IN ('fitness', 'health', 'body') THEN 'vitality'
    WHEN lower(v_quest.category) IN ('learning', 'study', 'knowledge') THEN 'intelligence'
    WHEN lower(v_quest.category) IN ('work', 'career', 'finance') THEN 'strength'
    WHEN lower(v_quest.category) IN ('social', 'relationships', 'community') THEN 'charisma'
    WHEN lower(v_quest.category) IN ('creative', 'creation', 'art') THEN 'dexterity'
    WHEN lower(v_quest.category) IN ('mindfulness', 'reflection', 'spirituality') THEN 'wisdom'
    ELSE NULL
  END;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;
  v_old_titles := v_profile.titles;
  v_level_before := v_profile.level;
  v_streak_before := v_profile.streak_days;

  IF v_attribute_key IS NULL THEN
    v_attribute_key := CASE v_profile.character_class
      WHEN 'mage' THEN 'intelligence'
      WHEN 'rogue' THEN 'dexterity'
      WHEN 'ranger' THEN 'vitality'
      WHEN 'cleric' THEN 'wisdom'
      ELSE 'strength'
    END;
  END IF;

  EXECUTE format(
    'SELECT %I FROM public.profiles WHERE id = $1',
    v_attribute_key
  )
  INTO v_attribute_previous_value
  USING v_quest.user_id;

  UPDATE public.quests
  SET status = 'completed', completed_at = v_completed_at
  WHERE id = p_quest_id;

  INSERT INTO public.quest_logs (quest_id, quest_title, xp_earned, difficulty, user_id, completed_at)
  VALUES (v_quest.id, v_quest.title, v_xp, v_quest.difficulty, v_quest.user_id, v_completed_at);

  v_progression := public.award_xp(v_quest.user_id, v_xp, v_coins);

  -- Attribute rewards are applied to the trusted category mapping, never to a
  -- browser-supplied column name or value.
  EXECUTE format(
    'UPDATE public.profiles SET %I = %I + $1 WHERE id = $2 RETURNING %I',
    v_attribute_key, v_attribute_key, v_attribute_key
  )
  INTO v_new_value
  USING v_attribute_gained, v_quest.user_id;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();

  -- Evaluate all title milestones after the completion, including quest-count
  -- milestones even when this completion did not cause a level-up.
  v_all_titles := public.get_titles_for_milestones(v_profile.level, v_profile.quests_completed);
  SELECT COALESCE(array_agg(t), ARRAY[]::text[]) INTO v_new_titles
  FROM unnest(v_all_titles) AS t
  WHERE NOT (t = ANY(v_profile.titles));

  IF cardinality(v_new_titles) > 0 THEN
    UPDATE public.profiles
    SET titles = v_profile.titles || v_new_titles,
        title = COALESCE(v_profile.title, v_new_titles[1])
    WHERE id = auth.uid();
  END IF;

  SELECT COALESCE(array_agg(DISTINCT t ORDER BY t), ARRAY[]::text[])
  INTO v_titles_unlocked
  FROM unnest(v_profile.titles || v_new_titles) AS t
  WHERE NOT (t = ANY(v_old_titles));

  INSERT INTO public.user_achievements (user_id, achievement_id)
  SELECT auth.uid(), a.id
  FROM public.achievement_definitions a
  WHERE
    (a.requirement_type = 'quests' AND v_profile.quests_completed >= a.threshold)
    OR (a.requirement_type = 'streak' AND v_profile.streak_days >= a.threshold)
    OR (a.requirement_type = 'level' AND v_profile.level >= a.threshold)
    OR (a.requirement_type = 'xp' AND v_profile.total_xp >= a.threshold)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'code', a.code,
    'name', a.name,
    'description', a.description
  ) ORDER BY a.name), '[]'::jsonb)
  INTO v_achievement_unlocks
  FROM public.achievement_definitions a
  JOIN public.user_achievements ua ON ua.achievement_id = a.id
  WHERE ua.user_id = auth.uid()
    AND ua.unlocked_at >= v_completed_at;

  RETURN v_progression || jsonb_build_object(
    'quest_id', v_quest.id,
    'coins_gained', v_coins,
    'coins_balance', v_profile.coins,
    'level_before', v_level_before,
    'streak_before', v_streak_before,
    'attribute', v_attribute_key,
    'attribute_gained', v_attribute_gained,
    'attribute_previous_value', v_attribute_previous_value,
    'attribute_value', v_new_value,
    'titles_unlocked', to_jsonb(v_titles_unlocked),
    'achievements_unlocked', v_achievement_unlocks
  );
END;
$$;

-- Client writes are limited to quest content. Ownership, lifecycle, and
-- reward/progression columns are protected by privileges plus RLS/functions.
REVOKE INSERT, UPDATE ON public.quests FROM authenticated;
GRANT SELECT, DELETE ON public.quests TO authenticated;
GRANT INSERT (title, description, type, difficulty, category,
  estimated_duration_minutes, due_date, tags) ON public.quests TO authenticated;
GRANT UPDATE (title, description, type, difficulty, category,
  estimated_duration_minutes, due_date, tags) ON public.quests TO authenticated;

GRANT SELECT ON public.profiles, public.quest_logs TO authenticated;
GRANT INSERT (id, username) ON public.profiles TO authenticated;
GRANT UPDATE (username, character_class) ON public.profiles TO authenticated;
GRANT SELECT ON public.achievement_definitions, public.user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.focus_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.abandon_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_quest(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.start_quest(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.focus_quest(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.abandon_quest(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_quest(uuid) FROM PUBLIC, anon;
