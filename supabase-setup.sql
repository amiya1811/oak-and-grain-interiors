-- ============================================================================
-- OAK & GRAIN INTERIORS — Supabase Database Setup & Security Configuration
-- ============================================================================
-- Execute this entire script in your Supabase Dashboard:
-- 1. Go to your Supabase Project -> SQL Editor
-- 2. Click "New query"
-- 3. Paste this entire file and click "Run"
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE: admin_profiles
-- Identifies authorised administrators for Oak & Grain Interiors.
-- Only the 3 approved studio emails can be administrators.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 2. TABLE: enquiries
-- Stores customer enquiry submissions from the Oak & Grain Interiors website.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    phone TEXT NOT NULL CHECK (char_length(trim(phone)) >= 10),
    email TEXT,
    service TEXT NOT NULL CHECK (char_length(trim(service)) > 0),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Completed')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 3. TABLE: activity_logs
-- Tracks website interactions and administrative actions.
-- (Note: Phone clicks track button interactions, not connected calls)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_phone ON public.enquiries(phone);
CREATE INDEX IF NOT EXISTS idx_enquiries_name ON public.enquiries(name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON public.activity_logs(event_type);

-- ============================================================================
-- 5. AUTOMATIC TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enquiries_updated_at ON public.enquiries;
CREATE TRIGGER trigger_enquiries_updated_at
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. AUTHORISED ADMIN VALIDATION FUNCTION (SECURITY DEFINER)
-- Checks if the authenticated user is one of the 3 strictly approved emails:
-- - amit@oakandgrain.in
-- - studio@oakandgrain.in
-- - manager@oakandgrain.in
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_profiles ap
    WHERE ap.id = auth.uid()
      AND lower(ap.email) IN ('amit@oakandgrain.in', 'studio@oakandgrain.in', 'manager@oakandgrain.in')
  );
$$;

-- ============================================================================
-- 7. TRIGGER: AUTO-REGISTER APPROVED ADMINS ON SUPABASE AUTH CREATION
-- When an approved admin account is created via Supabase Auth,
-- this trigger automatically connects them to public.admin_profiles.
-- Non-approved emails are ignored and will NOT gain admin access.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := lower(NEW.email);
  IF v_email IN ('amit@oakandgrain.in', 'studio@oakandgrain.in', 'manager@oakandgrain.in') THEN
    INSERT INTO public.admin_profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      v_email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(v_email, '@', 1)),
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_admin_user();

-- ============================================================================
-- 8. SCHEMA AND TABLE PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT INSERT ON TABLE public.enquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.enquiries TO authenticated;
GRANT ALL ON TABLE public.enquiries TO service_role;

GRANT INSERT ON TABLE public.activity_logs TO anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.activity_logs TO authenticated;
GRANT ALL ON TABLE public.activity_logs TO service_role;

GRANT SELECT ON TABLE public.admin_profiles TO authenticated;
GRANT ALL ON TABLE public.admin_profiles TO service_role;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies for: admin_profiles
-- Only verified admins can read admin profiles. No public access.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view admin profiles"
    ON public.admin_profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin() OR id = auth.uid());

-- ----------------------------------------------------------------------------
-- Policies for: enquiries
-- 1. Public (anon) and authenticated can SUBMIT (INSERT) enquiries.
-- 2. Public CANNOT read, update, or delete enquiries.
-- 3. Only verified admins can SELECT, UPDATE, and DELETE enquiries.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can insert enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Allow public insert on enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.enquiries;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_insert_policy" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_insert_anon" ON public.enquiries;

CREATE POLICY "Public can insert enquiries"
    ON public.enquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can select enquiries" ON public.enquiries;
CREATE POLICY "Admins can select enquiries"
    ON public.enquiries
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
CREATE POLICY "Admins can update enquiries"
    ON public.enquiries
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;
CREATE POLICY "Admins can delete enquiries"
    ON public.enquiries
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- Policies for: activity_logs
-- 1. Public (anon) and authenticated can INSERT activity events (tracking clicks, submissions).
-- 2. Only verified admins can SELECT activity logs.
-- 3. Public CANNOT read, update, or delete activity logs.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow event insertion" ON public.activity_logs;
CREATE POLICY "Allow event insertion"
    ON public.activity_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can select activity logs" ON public.activity_logs;
CREATE POLICY "Admins can select activity logs"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete activity logs" ON public.activity_logs;
CREATE POLICY "Admins can delete activity logs"
    ON public.activity_logs
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 10. NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 11. HELPER INSTRUCTIONS FOR CREATING THE 3 ADMIN ACCOUNTS IN SUPABASE
-- ============================================================================
-- You can create the 3 authorised admin accounts directly in your Supabase Dashboard:
--
-- Go to: Authentication -> Users -> Add User -> Create User
--
-- 1. Email: amit@oakandgrain.in     | Password: [Your secure password]
-- 2. Email: studio@oakandgrain.in   | Password: [Your secure password]
-- 3. Email: manager@oakandgrain.in  | Password: [Your secure password]
--
-- Toggle "Auto Confirm User?" to ON so the emails are immediately active.
-- As soon as they are created, the trigger on_auth_user_created will register
-- them in public.admin_profiles and grant them full dashboard access!
-- ============================================================================
