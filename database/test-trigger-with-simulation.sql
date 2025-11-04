-- =====================================================
-- Test Trigger by Simulating an Assignment
-- This will create a test assignment to trigger the notification
-- =====================================================

-- Step 1: Get available issues and users for testing
SELECT 
  'Available Issues' as info,
  id as issue_id,
  title
FROM issues
LIMIT 5;

SELECT 
  'Available Users' as info,
  id as user_id,
  email
FROM auth.users
LIMIT 5;

-- Step 2: Create a test assignment (this will trigger the notification)
-- Replace the IDs below with actual values from Step 1

-- Get IDs for testing
DO $$
DECLARE
  test_issue_id INTEGER;
  test_user_id UUID;
  test_assigned_by UUID;
  assignment_id UUID;
BEGIN
  -- Get an issue
  SELECT id INTO test_issue_id FROM issues LIMIT 1;
  
  -- Get a user to assign (not the admin)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1 OFFSET 1;
  
  -- Get admin user as assigner
  SELECT id INTO test_assigned_by FROM auth.users LIMIT 1;
  
  RAISE NOTICE 'Creating test assignment: Issue % assigned to user % by %', 
    test_issue_id, test_user_id, test_assigned_by;
  
  -- Insert assignment (this SHOULD trigger the notification)
  INSERT INTO issue_assignees (issue_id, user_id, assigned_by)
  VALUES (test_issue_id, test_user_id, test_assigned_by)
  ON CONFLICT (issue_id, user_id) DO NOTHING
  RETURNING id INTO assignment_id;
  
  IF assignment_id IS NULL THEN
    RAISE NOTICE 'Assignment already exists or conflict occurred. Try a different combination.';
  ELSE
    RAISE NOTICE '✅ Test assignment created with ID: %', assignment_id;
    RAISE NOTICE 'Now check the notifications table!';
  END IF;
END $$;

-- Step 3: Immediately check if notification was created
SELECT 
  '🎯 Notification Check' as check_type,
  COUNT(*) as notification_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SUCCESS! Notification created!'
    ELSE '❌ No notification created - trigger may not be working'
  END as status
FROM notifications
WHERE created_at > NOW() - INTERVAL '1 minute';

-- Step 4: Show the notification details if it was created
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
WHERE n.created_at > NOW() - INTERVAL '1 minute'
ORDER BY n.created_at DESC;

-- Step 5: Show the test assignment that was created
SELECT 
  ia.id,
  ia.issue_id,
  ia.user_id,
  ia.assigned_at,
  i.title as issue_title,
  u.email as assignee_email
FROM issue_assignees ia
JOIN issues i ON i.id = ia.issue_id
JOIN auth.users u ON u.id = ia.user_id
WHERE ia.assigned_at > NOW() - INTERVAL '1 minute'
ORDER BY ia.assigned_at DESC;

