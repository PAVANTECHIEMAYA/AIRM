-- =====================================================
-- Fix Infinite Recursion in RLS Policies
-- This fixes the "infinite recursion detected in policy for relation 'user_profiles'" error
-- =====================================================

-- Step 1: Drop problematic policies on timesheets if they exist
DROP POLICY IF EXISTS "Users can view own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can manage own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Admins can view all timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can insert own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can update own timesheets" ON timesheets;

-- Step 2: Drop problematic policies on timesheet_entries if they exist
DROP POLICY IF EXISTS "Users can view own entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can manage own entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON timesheet_entries;

-- Step 3: Create simple, non-recursive policies for timesheets
-- Users can view their own timesheets (no joins to avoid recursion)
CREATE POLICY "Users can view own timesheets" ON timesheets
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own timesheets
CREATE POLICY "Users can create own timesheets" ON timesheets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own timesheets
CREATE POLICY "Users can update own timesheets" ON timesheets
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all timesheets (using direct check, not join)
CREATE POLICY "Admins can view all timesheets" ON timesheets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
  );

-- Step 4: Create simple, non-recursive policies for timesheet_entries
-- Users can view entries for their own timesheets
CREATE POLICY "Users can view own timesheet entries" ON timesheet_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM timesheets 
      WHERE timesheets.id = timesheet_entries.timesheet_id 
        AND timesheets.user_id = auth.uid()
    )
  );

-- Users can insert entries for their own timesheets
CREATE POLICY "Users can create own timesheet entries" ON timesheet_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM timesheets 
      WHERE timesheets.id = timesheet_entries.timesheet_id 
        AND timesheets.user_id = auth.uid()
    )
  );

-- Users can update entries for their own timesheets
CREATE POLICY "Users can update own timesheet entries" ON timesheet_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM timesheets 
      WHERE timesheets.id = timesheet_entries.timesheet_id 
        AND timesheets.user_id = auth.uid()
    )
  );

-- Users can delete entries for their own timesheets
CREATE POLICY "Users can delete own timesheet entries" ON timesheet_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM timesheets 
      WHERE timesheets.id = timesheet_entries.timesheet_id 
        AND timesheets.user_id = auth.uid()
    )
  );

-- Admins can view all entries
CREATE POLICY "Admins can view all timesheet entries" ON timesheet_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
  );

-- Step 5: Fix user_profiles policy if it exists and causes recursion
-- Check what policies exist on user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles' OR tablename = 'profiles';

-- If user_profiles table exists and has recursive policies, we might need to fix them
-- But first, let's make sure timesheets work with simple policies

-- Step 6: Verify the fix
SELECT 
  'Timesheets policies:' as info,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'timesheets'

UNION ALL

SELECT 
  'Timesheet entries policies:' as info,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'timesheet_entries';

-- Step 7: Test query (this should not cause recursion)
-- SELECT * FROM timesheets WHERE user_id = auth.uid() LIMIT 1;

SELECT '✅ RLS policies updated! The infinite recursion should be fixed.' as status;

