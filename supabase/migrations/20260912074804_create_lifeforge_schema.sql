/*
# LifeForge — Core Schema

## Overview
Creates the foundational database tables for LifeForge, a gamified life management app.
Users create "quests" (tasks/habits/goals), complete them to earn XP, and level up their character.

## 1. New Tables

### profiles
- `id` (uuid, primary key, references auth.users) — one row per user
- `username` (text, unique, not null) — display name
- `level` (integer, default 1) — current character level
- `xp` (integer, default 0) — total experience points
- `xp_to_next_level` (integer, default 100) — XP needed for next level
- `streak_days` (integer, default 0) — consecutive-day completion streak
- `last_completion_date` (date, nullable) — date of last quest completion
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### quests
- `id` (uuid, primary key)
- `title` (text, not null) — quest name
- `description` (text, nullable) — optional details
- `type` (text, not null, default 'daily') — 'daily', 'weekly', 'one_time', 'habit'
- `difficulty` (text, not null, default 'normal') — 'trivial', 'easy', 'normal', 'hard', 'epic'
- `xp_reward` (integer, not null, default 10) — XP earned on completion
- `status` (text, not null, default 'active') — 'active', 'completed', 'abandoned'
- `completed_at` (timestamptz, nullable) — when the quest was finished
- `due_date` (date, nullable) — optional deadline
- `tags` (text[], default '{}') — optional category tags
- `user_id` (uuid, not null, default auth.uid()) — owner
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### quest_logs
- `id` (uuid, primary key)
- `quest_id` (uuid, references quests on delete cascade) — the quest that was completed
- `quest_title` (text, not null) — snapshot of quest title at completion time
- `xp_earned` (integer, not null) — XP awarded
- `difficulty` (text, not null) — snapshot of difficulty
- `user_id` (uuid, not null, default auth.uid()) — owner
- `completed_at` (timestamptz, default now())

## 2. Indexes
- `quests.user_id` — filter quests by owner
- `quests.status` — filter active vs completed
- `quest_logs.user_id` — fetch completion history
- `quest_logs.completed_at` — sort logs chronologically

## 3. Security (RLS)
- All tables have RLS enabled.
- All tables are owner-scoped: authenticated users can only CRUD their own rows.
- `user_id` columns default to `auth.uid()` so inserts without explicit user_id succeed.
- Four separate policies per table (SELECT, INSERT, UPDATE, DELETE).
- A trigger auto-creates a profile row when a new auth user signs up.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  xp_to_next_level integer NOT NULL DEFAULT 100,
  streak_days integer NOT NULL DEFAULT 0,
  last_completion_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- QUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'weekly', 'one_time', 'habit')),
  difficulty text NOT NULL DEFAULT 'normal' CHECK (difficulty IN ('trivial', 'easy', 'normal', 'hard', 'epic')),
  xp_reward integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_at timestamptz,
  due_date date,
  tags text[] NOT NULL DEFAULT '{}',
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quests" ON quests;
CREATE POLICY "select_own_quests" ON quests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quests" ON quests;
CREATE POLICY "insert_own_quests" ON quests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quests" ON quests;
CREATE POLICY "update_own_quests" ON quests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quests" ON quests;
CREATE POLICY "delete_own_quests" ON quests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_user_status ON quests(user_id, status);

-- ============================================================
-- QUEST_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quest_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid REFERENCES quests(id) ON DELETE CASCADE,
  quest_title text NOT NULL,
  xp_earned integer NOT NULL,
  difficulty text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quest_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quest_logs" ON quest_logs;
CREATE POLICY "select_own_quest_logs" ON quest_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quest_logs" ON quest_logs;
CREATE POLICY "insert_own_quest_logs" ON quest_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quest_logs" ON quest_logs;
CREATE POLICY "update_own_quest_logs" ON quest_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quest_logs" ON quest_logs;
CREATE POLICY "delete_own_quest_logs" ON quest_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quest_logs_user_id ON quest_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_logs_completed_at ON quest_logs(completed_at DESC);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_quests ON quests;
CREATE TRIGGER set_updated_at_quests
  BEFORE UPDATE ON quests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
