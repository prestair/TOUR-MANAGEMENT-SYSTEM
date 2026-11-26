-- =============================================
-- TOUR BILL MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'finance', 'admin')),
  department TEXT,
  employee_code TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_number TEXT NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tour_purpose TEXT NOT NULL,
  tour_from_date DATE NOT NULL,
  tour_to_date DATE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_taken NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_payable NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft','submitted','manager_approved','manager_rejected','finance_approved','finance_rejected','paid')),
  remarks TEXT,
  manager_remarks TEXT,
  manager_approved_at TIMESTAMPTZ,
  finance_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  finance_remarks TEXT,
  finance_approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLAIM FILES TABLE
CREATE TABLE IF NOT EXISTS public.claim_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_files ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CLAIMS POLICIES
CREATE POLICY "Employee can view own claims" ON public.claims
  FOR SELECT USING (
    employee_id = auth.uid()
    OR manager_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('finance', 'admin'))
  );

CREATE POLICY "Employee can insert own claims" ON public.claims
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Manager can update assigned claims" ON public.claims
  FOR UPDATE USING (
    manager_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('finance', 'admin'))
  );

-- CLAIM FILES POLICIES
CREATE POLICY "Users can view files of accessible claims" ON public.claim_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id AND (
        c.employee_id = auth.uid()
        OR c.manager_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('finance', 'admin'))
      )
    )
  );

CREATE POLICY "Employee can insert files for own claims" ON public.claim_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.claims c
      WHERE c.id = claim_id AND c.employee_id = auth.uid()
    )
  );

-- =============================================
-- STORAGE BUCKET
-- =============================================
-- Run this in Supabase Dashboard → Storage → Create bucket
-- Bucket name: tour-bills
-- Public: FALSE (private)

-- Storage policies (run after creating bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('tour-bills', 'tour-bills', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'tour-bills' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view accessible files" ON storage.objects
  FOR SELECT USING (bucket_id = 'tour-bills' AND auth.role() = 'authenticated');

-- =============================================
-- FIRST ADMIN USER SETUP
-- After running schema, create first user via Supabase Auth dashboard
-- Then run this to make them admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- =============================================
