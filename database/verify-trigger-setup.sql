-- =====================================================
-- Complete Trigger Verification
-- Run this to verify everything is set up correctly
-- =====================================================

-- 1. Check if triggers exist (should show 2 triggers)
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'issue_assignees'
ORDER BY trigger_name;

-- 2. Check if notification functions exist
SELECT 
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'notify_user_issue_assignment',
    'notify_issue_assigned_email',
    'create_notification'
  )
ORDER BY routine_name;

-- 3. Check if notifications table exists and structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 4. Check RLS policies on notifications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'notifications';

-- 5. Test if we can manually create a notification (replace with real user_id)
-- First, get a user_id to test with:
SELECT id, email FROM auth.users LIMIT 1;

-- Then uncomment and modify this (replace USER_ID_HERE with actual UUID):
/*
SELECT create_notification(
  (SELECT id FROM auth.users LIMIT 1)::UUID,
  'Test Notification',
  'This is a manual test',
  'test',
  '/test',
  NULL::UUID
);

-- Check if it was created:
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
*/

-- 6. Check the trigger function definition
SELECT 
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'notify_user_issue_assignment';

-- 7. Summary Status
SELECT 
  (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'issue_assignees') as trigger_count,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('notify_user_issue_assignment', 'create_notification')) as function_count,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'notifications') as table_exists,
  (SELECT COUNT(*) FROM notifications) as notification_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'issue_assignees') = 2
      AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'notify_user_issue_assignment') = 1
      AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'notifications') = 1
    THEN '✅ Setup looks correct - make a NEW assignment in app to test'
    ELSE '⚠️ Setup incomplete - check results above'
  END as status;

