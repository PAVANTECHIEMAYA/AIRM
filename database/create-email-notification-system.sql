-- =====================================================
-- Email Notification System with Supabase Edge Functions
-- =====================================================

-- Create email_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  resend_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email notifications"
  ON email_notifications FOR SELECT
  USING (recipient_email = auth.email());

CREATE POLICY "Service role can insert email notifications"
  ON email_notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Trigger Function for Issue Assignment Notifications
-- =====================================================

CREATE OR REPLACE FUNCTION notify_issue_assigned()
RETURNS TRIGGER AS $$
DECLARE
  assignee_email TEXT;
  assignee_name TEXT;
  assigned_by_name TEXT;
  issue_data JSONB;
BEGIN
  -- Only send notification if assignee changed
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to = NEW.assigned_to) THEN
    RETURN NEW;
  END IF;

  -- Only send if issue is assigned to someone
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get assignee email and name
  SELECT email, COALESCE(full_name, email)
  INTO assignee_email, assignee_name
  FROM auth.users
  WHERE id = NEW.assigned_to;

  -- Get admin/assigner name
  SELECT COALESCE(full_name, email, 'Admin')
  INTO assigned_by_name
  FROM auth.users
  WHERE id = COALESCE(NEW.created_by, auth.uid());

  -- Build issue data
  issue_data := jsonb_build_object(
    'to_email', assignee_email,
    'assignee_name', assignee_name,
    'assigned_by_name', assigned_by_name,
    'issue_id', NEW.id,
    'issue_title', NEW.title,
    'description', NEW.description,
    'priority', NEW.priority,
    'status', NEW.status,
    'due_date', NEW.due_date,
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
DROP TRIGGER IF EXISTS on_issue_assigned ON github_issues;
CREATE TRIGGER on_issue_assigned
  AFTER INSERT OR UPDATE OF assigned_to ON github_issues
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_assigned();

-- =====================================================
-- Trigger Function for Issue Comment Notifications
-- =====================================================

CREATE OR REPLACE FUNCTION notify_issue_comment()
RETURNS TRIGGER AS $$
DECLARE
  assignee_email TEXT;
  assignee_name TEXT;
  commenter_name TEXT;
  issue_title TEXT;
  issue_assignee UUID;
  comment_data JSONB;
BEGIN
  -- Get issue details
  SELECT assigned_to, title
  INTO issue_assignee, issue_title
  FROM github_issues
  WHERE id = NEW.issue_id;

  -- Only send if issue is assigned to someone
  IF issue_assignee IS NULL THEN
    RETURN NEW;
  END IF;

  -- Don't send notification to the person who commented
  IF issue_assignee = NEW.created_by THEN
    RETURN NEW;
  END IF;

  -- Get assignee email and name
  SELECT email, COALESCE(full_name, email)
  INTO assignee_email, assignee_name
  FROM auth.users
  WHERE id = issue_assignee;

  -- Get commenter name
  SELECT COALESCE(full_name, email, 'Admin')
  INTO commenter_name
  FROM auth.users
  WHERE id = NEW.created_by;

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for issue comments
-- First, check if issue_comments table exists, if not create it
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES github_issues(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS on_issue_comment ON issue_comments;
CREATE TRIGGER on_issue_comment
  AFTER INSERT ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_comment();

-- =====================================================
-- Trigger Function for Leave Request Notifications
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
  -- Only send notification for new requests or status pending
  IF (TG_OP = 'UPDATE' AND OLD.status != 'pending') THEN
    RETURN NEW;
  END IF;

  -- Get employee details
  SELECT email, COALESCE(full_name, email)
  INTO employee_email, employee_name
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Get admin email (first admin user)
  SELECT email INTO admin_email
  FROM profiles
  WHERE role = 'admin'
  LIMIT 1;

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
DROP TRIGGER IF EXISTS on_leave_request ON leave_requests;
CREATE TRIGGER on_leave_request
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_leave_request();

-- =====================================================
-- Helper function to set configuration (run after setup)
-- =====================================================

-- You'll need to run these commands after deploying:
-- SELECT set_config('app.base_url', 'https://your-app-url.com', false);
-- SELECT set_config('app.edge_function_url', 'https://your-project.supabase.co/functions/v1', false);
-- SELECT set_config('app.service_role_key', 'your-service-role-key', false);

-- For development, you can also use ALTER DATABASE to persist settings:
-- ALTER DATABASE postgres SET app.base_url = 'http://localhost:5173';
-- ALTER DATABASE postgres SET app.edge_function_url = 'http://localhost:54321/functions/v1';

-- =====================================================
-- Indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_assigned_to ON github_issues(assigned_to);

-- =====================================================
-- Grant necessary permissions
-- =====================================================

GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON email_notifications TO postgres, anon, authenticated, service_role;
GRANT ALL ON issue_comments TO postgres, anon, authenticated, service_role;

COMMENT ON TABLE email_notifications IS 'Tracks all email notifications sent by the system';
COMMENT ON FUNCTION notify_issue_assigned() IS 'Sends email when issue is assigned to a user';
COMMENT ON FUNCTION notify_issue_comment() IS 'Sends email when someone comments on an assigned issue';
COMMENT ON FUNCTION notify_leave_request() IS 'Sends email to admin when leave is requested';

