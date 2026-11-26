-- =============================================
-- USER_MANAGERS TABLE — many-to-many
-- Ek employee ke multiple managers ho sakte hain
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_managers (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id  TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, manager_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_managers_user    ON public.user_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_managers_manager ON public.user_managers(manager_id);

-- RLS
ALTER TABLE public.user_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read user_managers"
  ON public.user_managers FOR SELECT
  USING (true);

CREATE POLICY "Anyone authenticated can insert user_managers"
  ON public.user_managers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can delete user_managers"
  ON public.user_managers FOR DELETE
  USING (true);
