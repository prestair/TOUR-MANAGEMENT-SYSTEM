-- =============================================
-- MIGRATION: localStorage → Supabase
-- Run yeh script Supabase SQL Editor mein
-- =============================================

-- Step 1: Drop existing tables if schema change chahiye
DROP TABLE IF EXISTS public.claim_files CASCADE;
DROP TABLE IF EXISTS public.claims CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Profiles table
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'finance', 'admin')),
  department TEXT DEFAULT '',
  employee_code TEXT DEFAULT '',
  manager_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Claims table
CREATE TABLE public.claims (
  id TEXT PRIMARY KEY,
  claim_number TEXT UNIQUE NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_by_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT DEFAULT '',
  tour_purpose TEXT NOT NULL,
  tour_from_date DATE NOT NULL,
  tour_to_date DATE NOT NULL,
  site_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','on_hold','manager_approved','manager_rejected','finance_approved','finance_rejected','paid')),
  remarks TEXT DEFAULT '',
  manager_remarks TEXT DEFAULT '',
  manager_approved_at TIMESTAMPTZ,
  finance_remarks TEXT DEFAULT '',
  finance_approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Co-workers table (normalized — ek claim ke multiple co-workers)
CREATE TABLE public.claim_coworkers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  claim_id TEXT NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  father_name TEXT DEFAULT ''
);

-- Step 5: Attachments table (base64 storage — simple approach)
CREATE TABLE public.claim_attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  claim_id TEXT NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  base64 TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS claims_updated_at ON public.claims;
CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_coworkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_attachments ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (simple auth via cookie check in app layer)
-- Production mein proper auth.uid() use karo
CREATE POLICY "Allow all for profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all for claims" ON public.claims FOR ALL USING (true);
CREATE POLICY "Allow all for coworkers" ON public.claim_coworkers FOR ALL USING (true);
CREATE POLICY "Allow all for attachments" ON public.claim_attachments FOR ALL USING (true);

-- =============================================
-- SEED DEFAULT ADMIN
-- =============================================
INSERT INTO public.profiles (id, username, password, full_name, role, department, employee_code, manager_id)
VALUES 
  ('admin-001', 'admin', 'admin@123', 'Administrator', 'admin', 'Administration', 'ADM001', NULL)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- NOTES:
-- 1. Yeh schema localStorage structure ko exactly mirror karta hai
-- 2. Password hashing nahi — simple username/password check app layer mein
-- 3. Auth token-based nahi, cookie-based session management
-- 4. Base64 attachments directly DB mein (< 1MB ke liye okay)
-- =============================================
