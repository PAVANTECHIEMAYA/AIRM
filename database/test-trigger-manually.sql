-- =====================================================
-- Manual Trigger Test
-- This helps test if the trigger works on a new assignment
-- =====================================================

-- IMPORTANT: The notifications will only be created for NEW assignments
-- made AFTER the triggers were set up. Old assignments won't have notifications.

-- 1. First, verify triggers are active (should show 2 triggers)
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'issue_assignees';

-- 2. Check which assignments should have notifications (only recent ones)
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
    ELSE '❌ No notification (may be old assignment before trigger was set up)'
  END as notification_status
FROM issue_assignees ia
JOIN issues i ON i.id = ia.issue_id
JOIN auth.users u ON u.id = ia.user_id
ORDER BY ia.assigned_at DESC
LIMIT 10;

-- 3. To TEST if trigger works:
--    a) Go to your app
--    b) Assign a user to an issue (make a NEW assignment)
--    c) Then run query #2 again - you should see ✅ for the new assignment

-- 4. Check notifications table directly
SELECT 
  n.id,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at,
  u.email as user_email
FROM notifications n
JOIN auth.users u ON u.id = n.user_id
ORDER BY n.created_at DESC;

-- 5. If you want to manually test the trigger function (optional):
-- Get a recent issue_id and user_id, then create a test assignment
-- Replace VALUES below with real IDs from your database

/*
INSERT INTO issue_assignees (issue_id, user_id, assigned_by)
VALUES (
  (SELECT id FROM issues ORDER BY id DESC LIMIT 1),  -- latest issue
  (SELECT id FROM auth.users LIMIT 1 OFFSET 1),      -- second user
  (SELECT id FROM auth.users WHERE email = 'prasad.d@techiemaya.com')  -- admin
);

-- Then check if notification was created:
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
*/

