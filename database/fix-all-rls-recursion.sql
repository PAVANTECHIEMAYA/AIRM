-- =====================================================
-- Complete Fix for Infinite Recursion in RLS Policies
-- This fixes the "infinite recursion detected in policy for relation 'user_profiles'" error
-- =====================================================

-- Step 1: Check what policies currently exist
SELECT 
  'Current policies on user_profiles/profiles:' as info,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('user_profiles', 'profiles')
ORDER BY tablename, policyname;

-- Step 2: Drop ALL policies on user_profiles and profiles to break recursion
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Step 3: Recreate simple, non-recursive policies for user_profiles/profiles
-- Only if the table exists
DO $$
BEGIN
  -- Check if user_profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Simple policy: anyone can view, users can update their own
    EXECUTE 'CREATE POLICY "Public profiles are viewable" ON user_profiles FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid())';
  END IF;
  
  -- Check if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Simple policy: anyone can view, users can update their own
    EXECUTE 'CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid())';
    EXECUTE 'CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid())';
  END IF;
END $$;

-- Step 4: Fix timesheets policies (ensure no recursion)
DROP POLICY IF EXISTS "Users can view own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can manage own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Admins can view all timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can insert own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can update own timesheets" ON timesheets;

-- Simple timesheets policies (NO JOINS to avoid recursion)
CREATE POLICY "Users can view own timesheets" ON timesheets
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own timesheets" ON timesheets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own timesheets" ON timesheets
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admin policy using direct check (no join to user_profiles)
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

-- Step 5: Fix timesheet_entries policies
DROP POLICY IF EXISTS "Users can view own timesheet entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can manage own entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can delete own timesheet entries" ON timesheet_entries;
DROP POLICY IF EXISTS "Users can create own timesheet entries" ON timesheet_entries;

-- Simple timesheet_entries policies
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

-- Step 6: Verify the fix
SELECT 
  '✅ Policies Summary' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'timesheets') as timesheets_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'timesheet_entries') as entries_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('user_profiles', 'profiles')) as profiles_policies;

-- Step 7: Test query to verify no recursion
-- This should work now without recursion errors
-- SELECT * FROM timesheets WHERE user_id = auth.uid() LIMIT 1;

SELECT '✅ RLS policies fixed! The infinite recursion should be resolved.' as status;

