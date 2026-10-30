-- ============================================================================
-- OAK & GRAIN INTERIORS — Minimal SQL Fix for Enquiry Submission & RLS
-- ============================================================================
-- Run this script in your Supabase Dashboard:
-- 1. Open your Supabase Project -> SQL Editor
-- 2. Click "New query"
-- 3. Paste this entire script and click "Run"
--
-- This script:
-- - Fixes table-level permissions for the `anon` and `authenticated` roles
-- - Drops any conflicting or restrictive old policies
-- - Ensures public visitors can INSERT enquiries without RLS violations
-- - Ensures public visitors CANNOT read, update, or delete other enquiries
-- - Keeps admin management strictly restricted to the 3 studio emails
-- - Reloads the PostgREST schema cache
-- ============================================================================

-- 1. Ensure Schema and Table Privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT INSERT ON TABLE public.enquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.enquiries TO authenticated;
GRANT ALL ON TABLE public.enquiries TO service_role;

GRANT INSERT ON TABLE public.activity_logs TO anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.activity_logs TO authenticated;
GRANT ALL ON TABLE public.activity_logs TO service_role;

-- 2. Clean up any conflicting previous policies on enquiries
DROP POLICY IF EXISTS "Public can insert enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Allow public insert on enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.enquiries;
DROP POLICY IF EXISTS "Enable insert for anon" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_insert_policy" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_insert_anon" ON public.enquiries;

DROP POLICY IF EXISTS "Admins can select enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;

-- 3. Re-enable RLS on enquiries
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 4. INSERT Policy: Allow public visitors (anon) and authenticated users to submit enquiries
CREATE POLICY "Public can insert enquiries"
    ON public.enquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 5. SELECT Policy: ONLY authorized admins can read customer enquiries
CREATE POLICY "Admins can select enquiries"
    ON public.enquiries
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 6. UPDATE Policy: ONLY authorized admins can update status and notes
CREATE POLICY "Admins can update enquiries"
    ON public.enquiries
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. DELETE Policy: ONLY authorized admins can delete enquiries
CREATE POLICY "Admins can delete enquiries"
    ON public.enquiries
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 8. Activity logs policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

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

-- 9. Force PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
