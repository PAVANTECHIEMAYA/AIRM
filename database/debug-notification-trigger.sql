-- =====================================================
-- Debug Notification Trigger
-- This helps identify why notifications aren't being created
-- =====================================================

-- 1. Verify the trigger exists and is active
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'issue_assignees'
  AND trigger_name = 'trigger_notify_issue_assignment';

-- 2. Verify the function exists
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'notify_user_issue_assignment';

-- 3. Test the function directly with a recent assignment
-- Replace the values below with actual values from your issue_assignees table
SELECT * FROM issue_assignees ORDER BY assigned_at DESC LIMIT 1;

-- 4. Check if function can access issues table
SELECT id, title FROM issues LIMIT 5;

-- 5. Check if notifications table is accessible
SELECT COUNT(*) as notification_count FROM notifications;

-- 6. Test manual notification creation (replace user_id with a real one)
-- This will verify if the create_notification function works
-- SELECT create_notification(
--   'YOUR_USER_ID_HERE'::UUID,
--   'Test Notification',
--   'This is a test',
--   'test',
--   '/test',
--   NULL::UUID
-- );

-- 7. Check RLS policies on notifications table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';

-- 8. Check if the trigger function has errors
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'notify_user_issue_assignment';

-- 9. Verify recent assignments that should have triggered notifications
SELECT 
  ia.id,
  ia.issue_id,
  ia.user_id,
  ia.assigned_at,
  i.title as issue_title,
  u.email as assignee_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = ia.user_id AND n.related_id = ia.issue_id::UUID)
    THEN '✅ Has notification'
    ELSE '❌ Missing notification'
  END as notification_status
FROM issue_assignees ia
JOIN issues i ON i.id = ia.issue_id
JOIN auth.users u ON u.id = ia.user_id
ORDER BY ia.assigned_at DESC
LIMIT 10;

