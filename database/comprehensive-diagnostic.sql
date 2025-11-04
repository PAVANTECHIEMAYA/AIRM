-- =====================================================
-- Comprehensive Diagnostic - Find Why Notifications Aren't Working
-- =====================================================

-- STEP 1: Verify Setup Status
SELECT 
  '🔍 SETUP VERIFICATION' as section;

-- Check triggers (should show 2)
SELECT 
  'Trigger Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ OK'
    WHEN COUNT(*) = 1 THEN '⚠️ Only 1 trigger found'
    WHEN COUNT(*) = 0 THEN '❌ NO TRIGGERS FOUND!'
    ELSE '⚠️ Unexpected count'
  END as status,
  STRING_AGG(trigger_name, ', ') as trigger_names
FROM information_schema.triggers
WHERE event_object_table = 'issue_assignees';

-- Check functions (should show 3)
SELECT 
  'Function Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ OK'
    ELSE '❌ Functions missing'
  END as status,
  STRING_AGG(routine_name, ', ') as function_names
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('notify_user_issue_assignment', 'create_notification', 'notify_issue_assigned_email');

-- Check table exists
SELECT 
  'Table Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
    THEN '✅ notifications table exists'
    ELSE '❌ notifications table MISSING'
  END as status;

-- STEP 2: Check Permissions
SELECT 
  '🔐 PERMISSIONS CHECK' as section;

-- Check RLS policies
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ Insert policy exists'
    ELSE 'Info'
  END as status
FROM pg_policies
WHERE tablename = 'notifications';

-- STEP 3: Test Manual Notification Creation
SELECT 
  '🧪 MANUAL TEST' as section;

-- Get a test user
SELECT 
  'Test User' as info,
  id as user_id,
  email
FROM auth.users
LIMIT 1;

-- STEP 4: Check Recent Activity
SELECT 
  '📊 RECENT ACTIVITY' as section;

-- Show recent assignments (with notification check)
SELECT 
  ia.assigned_at,
  i.title as issue_title,
  u.email as assignee_email,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = ia.user_id 
        AND n.related_id = ia.issue_id::UUID
        AND n.type = 'issue_assigned'
    )
    THEN '✅ Has notification'
    WHEN ia.assigned_at < NOW() - INTERVAL '1 hour'
    THEN 'ℹ️ Old assignment (before trigger setup)'
    ELSE '❌ MISSING notification (trigger may not be working)'
  END as notification_status
FROM issue_assignees ia
JOIN issues i ON i.id = ia.issue_id
JOIN auth.users u ON u.id = ia.user_id
ORDER BY ia.assigned_at DESC
LIMIT 10;

-- STEP 5: Check Function Definition
SELECT 
  '📝 FUNCTION DEFINITION' as section;

-- Get the actual function code
SELECT 
  pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'notify_user_issue_assignment'
LIMIT 1;

-- STEP 6: RECOMMENDED ACTION
SELECT 
  '💡 NEXT STEPS' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'issue_assignees') = 2
      AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'notify_user_issue_assignment') = 1
    THEN 'Setup looks correct. Make a NEW assignment in your app RIGHT NOW, then check notifications again.'
    ELSE 'Setup incomplete. Review errors above and re-run setup-complete-notification-system.sql'
  END as recommendation;

