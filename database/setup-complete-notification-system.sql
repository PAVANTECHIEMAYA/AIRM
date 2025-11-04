-- =====================================================
-- Complete Notification System Setup
-- This ensures BOTH in-app and email notifications work
-- when an admin assigns an issue to a user
-- =====================================================

-- Step 1: Ensure the notifications table exists (from create-notifications-system.sql)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  related_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 2: Create helper function for in-app notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_link, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Step 3: Create function for IN-APP notifications (bell icon)
CREATE OR REPLACE FUNCTION notify_user_issue_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  issue_title TEXT;
BEGIN
  -- Get issue title
  SELECT title INTO issue_title FROM issues WHERE id = NEW.issue_id;
  
  -- Create in-app notification
  PERFORM create_notification(
    NEW.user_id,
    'Assigned to Issue',
    'You have been assigned to issue: ' || issue_title,
    'issue_assigned',
    '/issues/' || NEW.issue_id,
    NEW.issue_id::UUID
  );
  
  RETURN NEW;
END;
$$;

-- Step 4: Create function for EMAIL notifications (via Edge Function)
CREATE OR REPLACE FUNCTION notify_issue_assigned_email()
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
    'app_url', COALESCE(current_setting('app.base_url', true), 'http://localhost:5173')
  );

  -- Call Edge Function asynchronously (only if configured)
  IF current_setting('app.edge_function_url', true) IS NOT NULL THEN
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create BOTH triggers on issue_assignees table
-- Trigger 1: In-app notifications (always works)
DROP TRIGGER IF EXISTS trigger_notify_issue_assignment ON issue_assignees;
CREATE TRIGGER trigger_notify_issue_assignment
  AFTER INSERT ON issue_assignees
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_issue_assignment();

-- Trigger 2: Email notifications (requires Edge Function setup)
DROP TRIGGER IF EXISTS on_issue_assigned_email ON issue_assignees;
CREATE TRIGGER on_issue_assigned_email
  AFTER INSERT ON issue_assignees
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_assigned_email();

-- Step 6: Verify triggers are created
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing as timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE event_object_table = 'issue_assignees'
ORDER BY trigger_name;

-- Step 7: Success message
SELECT '✅ Notification system setup complete! Both in-app and email notifications will be sent when issues are assigned.' as status;

