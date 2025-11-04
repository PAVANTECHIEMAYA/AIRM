-- Check what triggers and functions currently exist
-- This helps verify the current notification setup

-- 1. Check all triggers on issue_assignees
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing as timing,
  event_manipulation as event,
  action_statement as function_called
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
    'notify_issue_assigned',
    'create_notification'
  )
ORDER BY routine_name;

-- 3. Check if notifications table exists and has data
SELECT 
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE read = false) as unread_notifications
FROM notifications;

-- 4. Summary
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_issue_assignment') 
      THEN '✅ In-app notification trigger exists'
    ELSE '❌ In-app notification trigger MISSING'
  END as in_app_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name LIKE '%issue_assigned%') 
      THEN '✅ Email notification trigger exists'
    ELSE '❌ Email notification trigger MISSING'
  END as email_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_notification') 
      THEN '✅ create_notification function exists'
    ELSE '❌ create_notification function MISSING'
  END as function_status;

