/*
  LifeForge — Persistent Relics, Reward Chests, and Completion Journey

  The existing complete_quest function remains authoritative for XP, coins,
  attributes, streaks, achievements, and titles. This migration adds the
  persistent "after the reward" layer and exposes one idempotent wrapper for
  the browser to call.
*/

CREATE TABLE IF NOT EXISTS public.relic_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  word text NOT NULL CHECK (word ~ '^[A-Z]+$'),
  name text NOT NULL,
  description text NOT NULL,
  final_item_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_relic_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relic_id uuid NOT NULL REFERENCES public.relic_definitions(id) ON DELETE CASCADE,
  fragments_unlocked integer NOT NULL DEFAULT 0 CHECK (fragments_unlocked >= 0),
  final_reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, relic_id)
);

CREATE TABLE IF NOT EXISTS public.reward_chests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL UNIQUE REFERENCES public.quests(id) ON DELETE CASCADE,
  relic_id uuid REFERENCES public.relic_definitions(id) ON DELETE SET NULL,
  fragment_index integer NOT NULL DEFAULT 0,
  reward_kind text NOT NULL CHECK (reward_kind IN ('fragment', 'complete', 'spark')),
  reward_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_chests_user_opened
  ON public.reward_chests(user_id, opened_at, created_at DESC);

ALTER TABLE public.relic_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_chests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_relic_definitions" ON public.relic_definitions;
CREATE POLICY "select_relic_definitions" ON public.relic_definitions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "select_own_relic_progress" ON public.user_relic_progress;
CREATE POLICY "select_own_relic_progress" ON public.user_relic_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_reward_chests" ON public.reward_chests;
CREATE POLICY "select_own_reward_chests" ON public.reward_chests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.relic_definitions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_relic_progress FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.reward_chests FROM authenticated;
GRANT SELECT ON public.relic_definitions, public.user_relic_progress, public.reward_chests TO authenticated;

DROP TRIGGER IF EXISTS set_updated_at_user_relic_progress ON public.user_relic_progress;
CREATE TRIGGER set_updated_at_user_relic_progress
  BEFORE UPDATE ON public.user_relic_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.relic_definitions (slug, word, name, description, final_item_slug)
VALUES (
  'daily-relic',
  'FORGE',
  'Daily Relic',
  'Five real-world victories reveal the word that powers your next chapter.',
  'forge-mark'
)
ON CONFLICT (slug) DO UPDATE SET
  word = EXCLUDED.word,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  final_item_slug = EXCLUDED.final_item_slug;

CREATE OR REPLACE FUNCTION public.preview_quest_reward(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quest public.quests%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_xp integer;
  v_coins integer;
  v_attribute text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id AND user_id = auth.uid();

  IF NOT FOUND OR v_quest.status NOT IN ('active', 'started', 'focused') THEN
    RETURN jsonb_build_object('error', 'Quest is not available for completion');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  v_xp := public.quest_xp_for(v_quest.difficulty, v_quest.estimated_duration_minutes);
  v_coins := GREATEST(1, CEIL(v_xp / 5.0)::integer);
  v_attribute := CASE
    WHEN lower(v_quest.category) IN ('fitness', 'health', 'body') THEN 'vitality'
    WHEN lower(v_quest.category) IN ('learning', 'study', 'knowledge') THEN 'intelligence'
    WHEN lower(v_quest.category) IN ('work', 'career', 'finance') THEN 'strength'
    WHEN lower(v_quest.category) IN ('social', 'relationships', 'community') THEN 'charisma'
    WHEN lower(v_quest.category) IN ('creative', 'creation', 'art') THEN 'dexterity'
    WHEN lower(v_quest.category) IN ('mindfulness', 'reflection', 'spirituality') THEN 'wisdom'
    WHEN v_profile.character_class = 'mage' THEN 'intelligence'
    WHEN v_profile.character_class = 'rogue' THEN 'dexterity'
    WHEN v_profile.character_class = 'ranger' THEN 'vitality'
    WHEN v_profile.character_class = 'cleric' THEN 'wisdom'
    ELSE 'strength'
  END;

  RETURN jsonb_build_object(
    'xp_gained', v_xp,
    'coins_gained', v_coins,
    'attribute', v_attribute,
    'attribute_gained', 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_completion_extras(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quest public.quests%ROWTYPE;
  v_relic public.relic_definitions%ROWTYPE;
  v_progress public.user_relic_progress%ROWTYPE;
  v_chest public.reward_chests%ROWTYPE;
  v_fragment_index integer;
  v_word_length integer;
  v_fragment text := NULL;
  v_kind text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id AND user_id = auth.uid();

  IF NOT FOUND OR v_quest.status <> 'completed' THEN
    RETURN jsonb_build_object('error', 'Completed quest not found');
  END IF;

  SELECT * INTO v_relic
  FROM public.relic_definitions
  WHERE slug = 'daily-relic';

  INSERT INTO public.user_relic_progress (user_id, relic_id)
  VALUES (auth.uid(), v_relic.id)
  ON CONFLICT (user_id, relic_id) DO NOTHING;

  SELECT * INTO v_progress
  FROM public.user_relic_progress
  WHERE user_id = auth.uid() AND relic_id = v_relic.id
  FOR UPDATE;

  -- A retry returns the original chest without advancing the collection.
  SELECT * INTO v_chest
  FROM public.reward_chests
  WHERE user_id = auth.uid() AND quest_id = p_quest_id
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'chest_id', v_chest.id,
      'chest_opened', v_chest.opened_at IS NOT NULL,
      'reward_kind', v_chest.reward_kind,
      'fragment', v_chest.reward_payload->>'fragment',
      'fragment_index', v_chest.fragment_index,
      'word', v_relic.word,
      'fragments_unlocked', v_progress.fragments_unlocked,
      'word_complete', v_progress.fragments_unlocked >= char_length(v_relic.word),
      'final_reward_claimed', v_progress.final_reward_claimed
    );
  END IF;

  v_word_length := char_length(v_relic.word);
  IF v_progress.fragments_unlocked < v_word_length THEN
    v_fragment_index := v_progress.fragments_unlocked + 1;
    v_fragment := substr(v_relic.word, v_fragment_index, 1);
    v_kind := CASE WHEN v_fragment_index = v_word_length THEN 'complete' ELSE 'fragment' END;
    UPDATE public.user_relic_progress
    SET fragments_unlocked = v_fragment_index
    WHERE user_id = auth.uid() AND relic_id = v_relic.id
    RETURNING * INTO v_progress;
  ELSE
    v_fragment_index := v_word_length;
    v_kind := 'spark';
  END IF;

  INSERT INTO public.reward_chests
    (user_id, quest_id, relic_id, fragment_index, reward_kind, reward_payload)
  VALUES (
    auth.uid(),
    p_quest_id,
    v_relic.id,
    v_fragment_index,
    v_kind,
    jsonb_build_object(
      'fragment', v_fragment,
      'position', v_fragment_index,
      'word', v_relic.word
    )
  )
  RETURNING * INTO v_chest;

  RETURN jsonb_build_object(
    'chest_id', v_chest.id,
    'chest_opened', false,
    'reward_kind', v_chest.reward_kind,
    'fragment', v_fragment,
    'fragment_index', v_fragment_index,
    'word', v_relic.word,
    'fragments_unlocked', v_progress.fragments_unlocked,
    'word_complete', v_progress.fragments_unlocked >= v_word_length,
    'final_reward_claimed', v_progress.final_reward_claimed
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.open_reward_chest(p_chest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_chest public.reward_chests%ROWTYPE;
  v_progress public.user_relic_progress%ROWTYPE;
  v_relic public.relic_definitions%ROWTYPE;
  v_item public.shop_items%ROWTYPE;
  v_inventory_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  SELECT * INTO v_chest
  FROM public.reward_chests
  WHERE id = p_chest_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Reward chest not found');
  END IF;

  SELECT * INTO v_relic FROM public.relic_definitions WHERE id = v_chest.relic_id;
  SELECT * INTO v_progress
  FROM public.user_relic_progress
  WHERE user_id = auth.uid() AND relic_id = v_chest.relic_id
  FOR UPDATE;

  UPDATE public.reward_chests
  SET opened_at = COALESCE(opened_at, now())
  WHERE id = v_chest.id
  RETURNING * INTO v_chest;

  IF v_progress.fragments_unlocked >= char_length(v_relic.word)
     AND NOT v_progress.final_reward_claimed
     AND v_relic.final_item_slug IS NOT NULL THEN
    SELECT * INTO v_item FROM public.shop_items WHERE slug = v_relic.final_item_slug;
    IF FOUND THEN
      INSERT INTO public.inventory_items (user_id, item_id)
      VALUES (auth.uid(), v_item.id)
      ON CONFLICT (user_id, item_id) DO NOTHING
      RETURNING id INTO v_inventory_id;

      UPDATE public.user_relic_progress
      SET final_reward_claimed = true
      WHERE user_id = auth.uid() AND relic_id = v_relic.id
      RETURNING * INTO v_progress;
    END IF;
  END IF;

  IF v_item.id IS NULL AND v_progress.final_reward_claimed THEN
    SELECT si.* INTO v_item
    FROM public.inventory_items ii
    JOIN public.shop_items si ON si.id = ii.item_id
    WHERE ii.user_id = auth.uid() AND si.slug = v_relic.final_item_slug;
  END IF;

  RETURN jsonb_build_object(
    'chest_id', v_chest.id,
    'chest_opened', true,
    'reward_kind', v_chest.reward_kind,
    'fragment', v_chest.reward_payload->>'fragment',
    'fragment_index', v_chest.fragment_index,
    'word', v_relic.word,
    'fragments_unlocked', v_progress.fragments_unlocked,
    'word_complete', v_progress.fragments_unlocked >= char_length(v_relic.word),
    'final_reward_claimed', v_progress.final_reward_claimed,
    'final_reward', CASE
      WHEN v_item.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'name', v_item.name,
        'rarity', v_item.rarity,
        'description', v_item.description,
        'appearance_key', v_item.appearance_key
      )
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_quest_with_extras(p_quest_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_completion jsonb;
  v_extras jsonb;
  v_profile public.profiles%ROWTYPE;
BEGIN
  v_completion := public.complete_quest(p_quest_id);
  IF v_completion ? 'error' THEN
    RETURN v_completion;
  END IF;

  v_extras := public.grant_completion_extras(p_quest_id);
  IF v_extras ? 'error' THEN
    RETURN v_completion || jsonb_build_object('extras_error', v_extras->>'error');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();

  RETURN v_completion || v_extras || jsonb_build_object(
    'xp_after', v_profile.xp,
    'xp_to_next_level_after', v_profile.xp_to_next_level,
    'total_xp_after', v_profile.total_xp,
    'level_after', v_profile.level
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_quest_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_quest_with_extras(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_reward_chest(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.preview_quest_reward(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_completion_extras(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.open_reward_chest(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_quest_with_extras(uuid) FROM PUBLIC, anon;