-- Check RLS Policies on timesheet_entries
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'timesheet_entries';

-- Check RLS Policies on timesheets
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'timesheets';

-- Test insert permissions (replace with actual user_id)
-- SELECT auth.uid() as current_user_id;

