-- =====================================================
-- Update Email Notification System for Issues
-- This updates the triggers to work with the existing issue_assignees structure
-- =====================================================

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS on_issue_assigned ON github_issues;
DROP TRIGGER IF EXISTS on_issue_assigned ON issues;
DROP TRIGGER IF EXISTS on_issue_comment ON issue_comments;
DROP TRIGGER IF EXISTS on_leave_request ON leave_requests;

-- Drop old functions
DROP FUNCTION IF EXISTS notify_issue_assigned();
DROP FUNCTION IF EXISTS notify_issue_comment();
DROP FUNCTION IF EXISTS notify_leave_request();

-- =====================================================
-- Updated Trigger Function for Issue Assignment Notifications
-- Works with issue_assignees table (many-to-many)
-- =====================================================

CREATE OR REPLACE FUNCTION notify_issue_assigned()
RETURNS TRIGGER AS $$
DECLARE
  assignee_email TEXT;
  assignee_name TEXT;
  assigned_by_name TEXT;
  issue_title TEXT;
  issue_description TEXT;
  issue_priority TEXT;
  issue_status TEXT;
  issue_data JSONB;
BEGIN
  -- Get assignee email and name
  SELECT u.email, COALESCE(p.full_name, u.email)
  INTO assignee_email, assignee_name
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;

  -- Get assigner name
  SELECT COALESCE(p.full_name, u.email, 'Admin')
  INTO assigned_by_name
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = COALESCE(NEW.assigned_by, auth.uid());

  -- Get issue details
  SELECT title, description, priority, status
  INTO issue_title, issue_description, issue_priority, issue_status
  FROM issues
  WHERE id = NEW.issue_id;

  -- Build issue data
  issue_data := jsonb_build_object(
    'to_email', assignee_email,
    'assignee_name', assignee_name,
    'assigned_by_name', assigned_by_name,
    'issue_id', NEW.issue_id,
    'issue_title', issue_title,
    'description', issue_description,
    'priority', issue_priority,
    'status', issue_status,
    'app_url', current_setting('app.base_url', true)
  );

  -- Call Edge Function asynchronously
  PERFORM
    net.http_post(
      url := current_setting('app.edge_function_url', true) || '/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'issueAssigned',
        'data', issue_data
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for issue assignments
CREATE TRIGGER on_issue_assigned
  AFTER INSERT ON issue_assignees
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_assigned();

-- =====================================================
-- Updated Trigger Function for Issue Comment Notifications
-- =====================================================

CREATE OR REPLACE FUNCTION notify_issue_comment()
RETURNS TRIGGER AS $$
DECLARE
  assignee_record RECORD;
  assignee_email TEXT;
  assignee_name TEXT;
  commenter_name TEXT;
  issue_title TEXT;
  comment_data JSONB;
BEGIN
  -- Get issue title
  SELECT title INTO issue_title FROM issues WHERE id = NEW.issue_id;

  -- Get commenter name
  SELECT COALESCE(p.full_name, u.email, 'Someone')
  INTO commenter_name
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;

  -- Loop through all assignees and send them notifications
  FOR assignee_record IN 
    SELECT ia.user_id 
    FROM issue_assignees ia 
    WHERE ia.issue_id = NEW.issue_id
  LOOP
    -- Skip if the commenter is the assignee
    IF assignee_record.user_id = NEW.user_id THEN
      CONTINUE;
    END IF;

    -- Get assignee email and name
    SELECT u.email, COALESCE(p.full_name, u.email)
    INTO assignee_email, assignee_name
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = assignee_record.user_id;

    -- Build comment data
    comment_data := jsonb_build_object(
      'to_email', assignee_email,
      'assignee_name', assignee_name,
      'commenter_name', commenter_name,
      'issue_id', NEW.issue_id,
      'issue_title', issue_title,
      'comment', NEW.comment,
      'created_at', NEW.created_at,
      'app_url', current_setting('app.base_url', true)
    );

    -- Call Edge Function asynchronously
    PERFORM
      net.http_post(
        url := current_setting('app.edge_function_url', true) || '/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'issueComment',
          'data', comment_data
        )
      );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for issue comments
CREATE TRIGGER on_issue_comment
  AFTER INSERT ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_comment();

-- =====================================================
-- Updated Trigger Function for Leave Request Notifications
-- =====================================================

CREATE OR REPLACE FUNCTION notify_leave_request()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
  employee_email TEXT;
  employee_name TEXT;
  total_days INTEGER;
  leave_data JSONB;
BEGIN
  -- Only send notification for new requests
  IF (TG_OP = 'UPDATE' AND OLD.status != 'pending') THEN
    RETURN NEW;
  END IF;

  -- Get employee details
  SELECT u.email, COALESCE(p.full_name, u.email)
  INTO employee_email, employee_name
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;

  -- Get admin email (first admin user from profiles table)
  SELECT u.email INTO admin_email
  FROM auth.users u
  INNER JOIN profiles p ON p.id = u.id
  WHERE p.role = 'admin'
  LIMIT 1;

  -- If no admin found, try user_roles table
  IF admin_email IS NULL THEN
    SELECT u.email INTO admin_email
    FROM auth.users u
    INNER JOIN user_roles ur ON ur.user_id = u.id
    WHERE ur.role = 'admin'
    LIMIT 1;
  END IF;

  -- Calculate total days
  total_days := (NEW.end_date - NEW.start_date) + 1;

  -- Build leave request data
  leave_data := jsonb_build_object(
    'to_email', admin_email,
    'employee_name', employee_name,
    'employee_email', employee_email,
    'request_id', NEW.id,
    'leave_type', NEW.leave_type,
    'start_date', NEW.start_date,
    'end_date', NEW.end_date,
    'total_days', total_days,
    'reason', NEW.reason,
    'is_urgent', (NEW.start_date - CURRENT_DATE) < 3,
    'created_at', NEW.created_at,
    'app_url', current_setting('app.base_url', true)
  );

  -- Call Edge Function asynchronously
  PERFORM
    net.http_post(
      url := current_setting('app.edge_function_url', true) || '/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'leaveRequest',
        'data', leave_data
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for leave requests
CREATE TRIGGER on_leave_request
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_leave_request();

-- =====================================================
-- Verify triggers are created
-- =====================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing as timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_name IN ('on_issue_assigned', 'on_issue_comment', 'on_leave_request')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- Test query to verify data exists
-- =====================================================

SELECT 'Issue Assignees:' as info, COUNT(*) as count FROM issue_assignees
UNION ALL
SELECT 'Issue Comments:' as info, COUNT(*) as count FROM issue_comments
UNION ALL  
SELECT 'Leave Requests:' as info, COUNT(*) as count FROM leave_requests
UNION ALL
SELECT 'Email Notifications:' as info, COUNT(*) as count FROM email_notifications;

