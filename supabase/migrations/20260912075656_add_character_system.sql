/*
# LifeForge — RPG Character System

## Overview
Adds coins, RPG attributes (STR, INT, VIT, DEX, CHA, WIS), titles, character class,
attribute points, and server-side XP/level/coin calculation functions.
All XP and level math happens in PostgreSQL functions — the frontend never computes or writes these values directly.

## 1. Modified Tables

### profiles (new columns)
- `coins` (integer, default 0) — in-game currency earned by completing quests
- `total_xp` (bigint, default 0) — lifetime XP, never resets (unlike `xp` which is current-level XP)
- `character_class` (text, default 'warrior') — 'warrior', 'mage', 'rogue', 'ranger', 'cleric'
- `title` (text, nullable) — currently equipped title (e.g. 'Novice Adventurer')
- `titles` (text[], default '{}') — all unlocked titles
- `attribute_points` (integer, default 0) — unspent points to allocate
- `strength` (integer, default 10) — physical power
- `intelligence` (integer, default 10) — mental acuity
- `vitality` (integer, default 10) — health and endurance
- `dexterity` (integer, default 10) — agility and coordination
- `charisma` (integer, default 10) — social influence
- `wisdom` (integer, default 10) — insight and judgment
- `quests_completed` (integer, default 0) — lifetime quest completion count

## 2. New Functions (all SECURITY DEFINER)

### award_xp(p_user_id uuid, p_xp_amount integer, p_coins integer DEFAULT 0)
- Adds XP to the user's profile, handles level-up logic server-side.
- Level formula: xp_to_next_level = 100 * level^1.5 (rounded).
- On level-up: carries over excess XP, grants 3 attribute points per level, unlocks titles at milestones.
- Updates streak_days and last_completion_date.
- Increments quests_completed.
- Returns JSON with: new_level, leveled_up, xp_gained, coins_gained, titles_unlocked (array).
- This function is called by the complete_quest RPC — not directly by the client.

### complete_quest(p_quest_id uuid)
- Marks a quest as completed, creates a quest_log entry, calls award_xp.
- Validates quest ownership and that the quest is still active.
- Returns JSON with quest completion + level-up results.

### spend_attribute_point(p_user_id uuid, p_attribute text)
- Spends 1 attribute point on the given attribute (strength, intelligence, etc.).
- Validates the user has points to spend.
- Returns the new attribute value.

### equip_title(p_user_id uuid, p_title text)
- Sets the user's active title. Validates the title is in their unlocked titles array.
- Returns success/failure.

### get_character_sheet(p_user_id uuid)
- Returns a JSON blob with full character data: level, xp, total_xp, coins, all attributes,
  title, titles, class, attribute_points, quests_completed, streak_days.

## 3. Column-Level Privileges
- Users can UPDATE only: username, character_class on their profile.
- Coins, level, xp, total_xp, xp_to_next_level, attribute_points, attributes, titles, title,
  streak_days, last_completion_date, quests_completed — NOT user-writable.
- These columns are only modified by SECURITY DEFINER functions (award_xp, spend_attribute_point, equip_title).

## 4. Title Definitions
Titles are unlocked at level milestones:
- Level 1: 'Novice Adventurer'
- Level 5: 'Seasoned Explorer'
- Level 10: 'Veteran Hero'
- Level 20: 'Legendary Champion'
- Level 30: 'Mythic Legend'
- Level 50: 'Eternal Paragon'
- 100 quests completed: 'Quest Conqueror'
- 500 quests completed: 'Relentless'
- 1000 quests completed: 'Unstoppable Force'

## 5. Security
- RLS policies unchanged (owner-scoped CRUD on profiles, quests, quest_logs).
- Column-level REVOKE on sensitive columns prevents direct client writes.
- SECURITY DEFINER functions bypass RLS for controlled mutations.
*/

-- ============================================================
-- ADD COLUMNS TO profiles
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_xp bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS character_class text NOT NULL DEFAULT 'warrior'
    CHECK (character_class IN ('warrior', 'mage', 'rogue', 'ranger', 'cleric')),
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS titles text[] NOT NULL DEFAULT ARRAY['Novice Adventurer'],
  ADD COLUMN IF NOT EXISTS attribute_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS intelligence integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS vitality integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS dexterity integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS charisma integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS wisdom integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS quests_completed integer NOT NULL DEFAULT 0;

-- Set default title for existing profiles
UPDATE profiles SET title = 'Novice Adventurer' WHERE title IS NULL;

-- ============================================================
-- COLUMN-LEVEL PRIVILEGES
-- Revoke UPDATE on sensitive columns from authenticated role
-- ============================================================
REVOKE UPDATE (coins, level, xp, total_xp, xp_to_next_level, attribute_points,
  strength, intelligence, vitality, dexterity, charisma, wisdom,
  titles, title, streak_days, last_completion_date, quests_completed)
  ON profiles FROM authenticated;

-- ============================================================
-- HELPER: compute xp needed for a given level
-- Formula: 100 * level^1.5 (rounded)
-- ============================================================
CREATE OR REPLACE FUNCTION public.xp_for_level(p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(1, ROUND(100 * POWER(p_level, 1.5)))::integer;
$$;

-- ============================================================
-- HELPER: get all titles for a given level + quest count
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_titles_for_milestones(p_level integer, p_quests_completed integer)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY(
    SELECT title FROM (VALUES
      (1, 'Novice Adventurer'),
      (5, 'Seasoned Explorer'),
      (10, 'Veteran Hero'),
      (20, 'Legendary Champion'),
      (30, 'Mythic Legend'),
      (50, 'Eternal Paragon')
    ) AS level_titles(level, title)
    WHERE level_titles.level <= p_level
    UNION
    SELECT title FROM (VALUES
      (100, 'Quest Conqueror'),
      (500, 'Relentless'),
      (1000, 'Unstoppable Force')
    ) AS quest_titles(quests, title)
    WHERE quest_titles.quests <= p_quests_completed
  );
$$;

-- ============================================================
-- award_xp — server-side XP, level-up, coins, streak, titles
-- ============================================================
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_xp_amount integer,
  p_coins integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_new_level integer;
  v_xp_remaining integer;
  v_xp_needed integer;
  v_leveled_up boolean := false;
  v_titles_unlocked text[] := ARRAY[]::text[];
  v_all_titles text[];
  v_new_titles text[];
  v_streak integer;
  v_today date := CURRENT_DATE;
  v_days_since integer;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- Streak calculation
  IF v_profile.last_completion_date IS NULL THEN
    v_streak := 1;
  ELSE
    v_days_since := v_today - v_profile.last_completion_date;
    IF v_days_since = 0 THEN
      v_streak := v_profile.streak_days;  -- already completed today, no change
    ELSIF v_days_since = 1 THEN
      v_streak := v_profile.streak_days + 1;  -- consecutive day
    ELSE
      v_streak := 1;  -- streak broken
    END IF;
  END IF;

  -- Add XP and coins
  v_xp_remaining := v_profile.xp + p_xp_amount;
  v_new_level := v_profile.level;

  -- Level-up loop
  WHILE v_xp_remaining >= v_profile.xp_to_next_level LOOP
    v_xp_remaining := v_xp_remaining - v_profile.xp_to_next_level;
    v_new_level := v_new_level + 1;
    v_xp_needed := public.xp_for_level(v_new_level);
    v_leveled_up := true;
  END LOOP;

  -- If leveled up, also award attribute points (3 per level gained)
  IF v_leveled_up THEN
    -- Compute titles for new level + quest count
    v_all_titles := public.get_titles_for_milestones(
      v_new_level,
      v_profile.quests_completed + 1
    );

    -- Find titles that are new (not already in profile.titles)
    SELECT array_agg(t) INTO v_new_titles
    FROM unnest(v_all_titles) AS t
    WHERE NOT (t = ANY(v_profile.titles));

    IF v_new_titles IS NOT NULL THEN
      v_titles_unlocked := v_new_titles;
    END IF;
  END IF;

  -- Update profile
  UPDATE profiles SET
    xp = v_xp_remaining,
    total_xp = v_profile.total_xp + p_xp_amount,
    coins = v_profile.coins + p_coins,
    level = v_new_level,
    xp_to_next_level = public.xp_for_level(v_new_level),
    attribute_points = v_profile.attribute_points + (CASE WHEN v_leveled_up THEN 3 * (v_new_level - v_profile.level) ELSE 0 END),
    streak_days = v_streak,
    last_completion_date = v_today,
    quests_completed = v_profile.quests_completed + 1,
    titles = CASE WHEN v_titles_unlocked <> ARRAY[]::text[] THEN v_profile.titles || v_titles_unlocked ELSE v_profile.titles END,
    title = CASE WHEN v_profile.title IS NULL AND v_titles_unlocked <> ARRAY[]::text[] THEN v_titles_unlocked[1] ELSE v_profile.title END
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'xp_gained', p_xp_amount,
    'coins_gained', p_coins,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'titles_unlocked', to_jsonb(v_titles_unlocked),
    'streak', v_streak,
    'quests_completed', v_profile.quests_completed + 1
  );
END;
$$;

-- ============================================================
-- complete_quest — marks quest done, awards XP/coins
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_quest(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quest quests%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quest not found');
  END IF;

  IF v_quest.user_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  IF v_quest.status != 'active' THEN
    RETURN jsonb_build_object('error', 'Quest is not active');
  END IF;

  -- Mark quest as completed
  UPDATE quests SET
    status = 'completed',
    completed_at = now()
  WHERE id = p_quest_id;

  -- Create quest log entry
  INSERT INTO quest_logs (quest_id, quest_title, xp_earned, difficulty, user_id)
  VALUES (v_quest.id, v_quest.title, v_quest.xp_reward, v_quest.difficulty, v_quest.user_id);

  -- Award XP and coins (coins = xp_reward / 5, minimum 1)
  v_result := public.award_xp(
    v_quest.user_id,
    v_quest.xp_reward,
    GREATEST(1, v_quest.xp_reward / 5)
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- spend_attribute_point — allocate 1 point to an attribute
-- ============================================================
CREATE OR REPLACE FUNCTION public.spend_attribute_point(p_attribute text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_valid_attributes text[] := ARRAY['strength', 'intelligence', 'vitality', 'dexterity', 'charisma', 'wisdom'];
  v_new_value integer;
BEGIN
  IF NOT (p_attribute = ANY(v_valid_attributes)) THEN
    RETURN jsonb_build_object('error', 'Invalid attribute');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  IF v_profile.attribute_points <= 0 THEN
    RETURN jsonb_build_object('error', 'No attribute points available');
  END IF;

  -- Increment the attribute and decrement points
  EXECUTE format('UPDATE profiles SET %I = %I + 1, attribute_points = attribute_points - 1 WHERE id = $1 RETURNING %I', p_attribute, p_attribute, p_attribute)
    INTO v_new_value
    USING v_profile.id;

  RETURN jsonb_build_object(
    'attribute', p_attribute,
    'new_value', v_new_value,
    'attribute_points_remaining', v_profile.attribute_points - 1
  );
END;
$$;

-- ============================================================
-- equip_title — set active title
-- ============================================================
CREATE OR REPLACE FUNCTION public.equip_title(p_title text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  IF NOT (p_title = ANY(v_profile.titles)) THEN
    RETURN jsonb_build_object('error', 'Title not unlocked');
  END IF;

  UPDATE profiles SET title = p_title WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true, 'title', p_title);
END;
$$;

-- ============================================================
-- get_character_sheet — full character data in one call
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_character_sheet()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  RETURN jsonb_build_object(
    'level', v_profile.level,
    'xp', v_profile.xp,
    'total_xp', v_profile.total_xp,
    'xp_to_next_level', v_profile.xp_to_next_level,
    'coins', v_profile.coins,
    'character_class', v_profile.character_class,
    'title', v_profile.title,
    'titles', to_jsonb(v_profile.titles),
    'attribute_points', v_profile.attribute_points,
    'strength', v_profile.strength,
    'intelligence', v_profile.intelligence,
    'vitality', v_profile.vitality,
    'dexterity', v_profile.dexterity,
    'charisma', v_profile.charisma,
    'wisdom', v_profile.wisdom,
    'quests_completed', v_profile.quests_completed,
    'streak_days', v_profile.streak_days,
    'last_completion_date', v_profile.last_completion_date
  );
END;
$$;

-- ============================================================
-- GRANT EXECUTE on functions to authenticated
-- ============================================================
GRANT EXECUTE ON FUNCTION public.complete_quest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_attribute_point(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.equip_title(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_character_sheet() TO authenticated;
