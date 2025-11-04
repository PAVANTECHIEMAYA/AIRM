-- =====================================================
-- Manual Notification Test
-- This will create a test notification to verify the system works
-- =====================================================

-- Step 1: Get a user ID to test with
SELECT 
  'Available Users for Testing' as info,
  id as user_id,
  email
FROM auth.users
LIMIT 5;

-- Step 2: Create a test notification manually
-- Replace USER_ID_HERE with an actual UUID from Step 1
-- Uncomment and run:

/*
-- Test with first user
SELECT create_notification(
  (SELECT id FROM auth.users LIMIT 1)::UUID,
  '🧪 Test Notification',
  'This is a manual test notification to verify the system works',
  'test',
  '/test',
  NULL::UUID
);
*/

-- Step 3: Check if notification was created
SELECT 
  'Manual Test Result' as test,
  n.id,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at,
  u.email as user_email
FROM notifications n
JOIN auth.users u ON u.id = n.user_id
WHERE n.type = 'test'
ORDER BY n.created_at DESC
LIMIT 5;

-- Step 4: If manual test works, but trigger doesn't:
-- The issue is likely with the trigger function or permissions
-- Check the trigger function for errors

-- Step 5: Test the trigger function directly with a recent assignment
-- Get a recent assignment first:
SELECT 
  ia.id as assignment_id,
  ia.issue_id,
  ia.user_id,
  i.title as issue_title,
  u.email as assignee_email
FROM issue_assignees ia
JOIN issues i ON i.id = ia.issue_id
JOIN auth.users u ON u.id = ia.user_id
ORDER BY ia.assigned_at DESC
LIMIT 1;

-- Then we can manually call the function (uncomment and modify):
/*
-- Create a test assignment record to trigger the function
-- This simulates what happens when admin assigns an issue
DO $$
DECLARE
  test_issue_id INTEGER;
  test_user_id UUID;
  test_assigned_by UUID;
BEGIN
  -- Get IDs
  SELECT id INTO test_issue_id FROM issues LIMIT 1;
  SELECT id INTO test_user_id FROM auth.users LIMIT 1 OFFSET 1;
  SELECT id INTO test_assigned_by FROM auth.users WHERE email LIKE '%admin%' OR email LIKE '%prasad%' LIMIT 1;
  
  -- Insert assignment (this should trigger the notification)
  INSERT INTO issue_assignees (issue_id, user_id, assigned_by)
  VALUES (test_issue_id, test_user_id, test_assigned_by)
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Test assignment created. Check notifications table now.';
END $$;
*/

