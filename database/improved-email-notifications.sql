-- Enhanced Email Notifications with Beautiful Templates
-- This improves the email templates with better styling and structure

-- Drop existing functions to recreate with better templates
DROP FUNCTION IF EXISTS send_email_issue_assignment() CASCADE;
DROP FUNCTION IF EXISTS send_email_issue_comment() CASCADE;
DROP FUNCTION IF EXISTS send_email_leave_status() CASCADE;
DROP FUNCTION IF EXISTS send_email_leave_request() CASCADE;

-- Helper function to get user's full name or email
CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  SELECT full_name, email INTO user_name, user_email 
  FROM auth.users 
  WHERE id = user_id;
  
  IF user_name IS NOT NULL AND user_name != '' THEN
    RETURN user_name;
  ELSE
    RETURN SPLIT_PART(user_email, '@', 1);
  END IF;
END;
$$;

-- Email template wrapper function
CREATE OR REPLACE FUNCTION email_template_wrapper(
  title TEXT,
  content TEXT,
  cta_text TEXT DEFAULT NULL,
  cta_link TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .content h2 { color: #667eea; margin-top: 0; font-size: 20px; }
    .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .info-box strong { color: #495057; }
    .cta-button { display: inline-block; background: #667eea; color: white !important; text-decoration: none; padding: 12px 30px; border-radius: 6px; margin: 20px 0; font-weight: 500; transition: background 0.3s; }
    .cta-button:hover { background: #5568d3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
    blockquote { background: #f8f9fa; border-left: 4px solid #667eea; padding: 10px 15px; margin: 15px 0; font-style: italic; color: #495057; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 TechieMaya Timesheet</h1>
    </div>
    <div class="content">
      <h2>' || title || '</h2>
      ' || content || '
      ' || CASE WHEN cta_text IS NOT NULL AND cta_link IS NOT NULL THEN
        '<div style="text-align: center;">
          <a href="' || cta_link || '" class="cta-button">' || cta_text || '</a>
        </div>'
      ELSE '' END || '
    </div>
    <div class="footer">
      <p>This is an automated notification from TechieMaya Timesheet.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  ';
END;
$$;

-- Function to send email notification when issue is assigned
CREATE OR REPLACE FUNCTION send_email_issue_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  issue_title TEXT;
  issue_description TEXT;
  user_email TEXT;
  assigner_name TEXT;
  base_url TEXT;
  email_content TEXT;
BEGIN
  -- Get configuration
  base_url := current_setting('app.base_url', true);
  IF base_url IS NULL THEN
    base_url := 'http://localhost:5173';
  END IF;
  
  -- Get issue details
  SELECT title, description INTO issue_title, issue_description 
  FROM issues WHERE id = NEW.issue_id;
  
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  -- Get assigner name
  assigner_name := get_user_display_name(NEW.assigned_by);
  
  -- Build email content
  email_content := '
    <p>👤 <strong>' || assigner_name || '</strong> has assigned you to a new issue:</p>
    <div class="info-box">
      <h3 style="margin-top: 0;">' || issue_title || '</h3>
      ' || CASE WHEN issue_description IS NOT NULL THEN 
        '<p>' || issue_description || '</p>' 
      ELSE '' END || '
    </div>
    <p>Please review the issue and start working on it as soon as possible.</p>
  ';
  
  -- Insert into email queue
  INSERT INTO email_queue (
    recipient_email,
    subject,
    body_html,
    notification_type,
    related_id
  ) VALUES (
    user_email,
    '🎯 You''ve been assigned to: ' || issue_title,
    email_template_wrapper(
      '📋 New Issue Assignment',
      email_content,
      '👉 View Issue',
      base_url || '/issues/' || NEW.issue_id
    ),
    'issue_assigned',
    NEW.issue_id::UUID
  );
  
  RETURN NEW;
END;
$$;

-- Function to send email notification when comment is added
CREATE OR REPLACE FUNCTION send_email_issue_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  issue_title TEXT;
  assignee_record RECORD;
  commenter_name TEXT;
  base_url TEXT;
  email_content TEXT;
  issue_creator UUID;
  creator_email TEXT;
BEGIN
  -- Get configuration
  base_url := current_setting('app.base_url', true);
  IF base_url IS NULL THEN
    base_url := 'http://localhost:5173';
  END IF;
  
  -- Get issue details
  SELECT title, created_by INTO issue_title, issue_creator FROM issues WHERE id = NEW.issue_id;
  commenter_name := get_user_display_name(NEW.user_id);
  
  -- Build email content
  email_content := '
    <p>💬 <strong>' || commenter_name || '</strong> commented on an issue you''re involved with:</p>
    <div class="info-box">
      <h3 style="margin-top: 0;">' || issue_title || '</h3>
    </div>
    <blockquote>' || NEW.comment || '</blockquote>
    <p>Click below to view the full discussion and respond.</p>
  ';
  
  -- Notify all assignees (except the commenter)
  FOR assignee_record IN 
    SELECT ia.user_id, au.email 
    FROM issue_assignees ia
    JOIN auth.users au ON ia.user_id = au.id
    WHERE ia.issue_id = NEW.issue_id AND ia.user_id != NEW.user_id
  LOOP
    INSERT INTO email_queue (
      recipient_email,
      subject,
      body_html,
      notification_type,
      related_id
    ) VALUES (
      assignee_record.email,
      '💬 New comment on: ' || issue_title,
      email_template_wrapper(
        '💬 New Comment on Issue',
        email_content,
        '👉 View & Respond',
        base_url || '/issues/' || NEW.issue_id
      ),
      'issue_comment',
      NEW.issue_id::UUID
    );
  END LOOP;
  
  -- Notify issue creator if they're not the commenter and not already notified
  IF issue_creator IS NOT NULL AND issue_creator != NEW.user_id THEN
    IF NOT EXISTS (SELECT 1 FROM issue_assignees WHERE issue_id = NEW.issue_id AND user_id = issue_creator) THEN
      SELECT email INTO creator_email FROM auth.users WHERE id = issue_creator;
      
      INSERT INTO email_queue (
        recipient_email,
        subject,
        body_html,
        notification_type,
        related_id
      ) VALUES (
        creator_email,
        '💬 New comment on your issue: ' || issue_title,
        email_template_wrapper(
          '💬 New Comment on Your Issue',
          email_content,
          '👉 View & Respond',
          base_url || '/issues/' || NEW.issue_id
        ),
        'issue_comment',
        NEW.issue_id::UUID
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to send email notification for leave status changes
CREATE OR REPLACE FUNCTION send_email_leave_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  status_emoji TEXT;
  status_color TEXT;
  base_url TEXT;
  email_content TEXT;
BEGIN
  -- Only send email if status changed to approved or rejected
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    -- Get configuration
    base_url := current_setting('app.base_url', true);
    IF base_url IS NULL THEN
      base_url := 'http://localhost:5173';
    END IF;
    
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    
    -- Set status emoji and color
    IF NEW.status = 'approved' THEN
      status_emoji := '✅';
      status_color := '#28a745';
    ELSE
      status_emoji := '❌';
      status_color := '#dc3545';
    END IF;
    
    -- Build email content
    email_content := '
      <p style="font-size: 18px; color: ' || status_color || '; font-weight: 600;">
        ' || status_emoji || ' Your leave request has been <span style="text-transform: uppercase;">' || NEW.status || '</span>
      </p>
      <div class="info-box">
        <p><strong>Leave Type:</strong> ' || UPPER(NEW.leave_type) || '</p>
        <p><strong>Duration:</strong> ' || NEW.start_date || ' to ' || NEW.end_date || '</p>
        <p><strong>Total Days:</strong> ' || (NEW.end_date::date - NEW.start_date::date + 1) || ' days</p>
        ' || CASE WHEN NEW.reason IS NOT NULL THEN 
          '<p><strong>Your Reason:</strong> ' || NEW.reason || '</p>' 
        ELSE '' END || '
        ' || CASE WHEN NEW.admin_notes IS NOT NULL THEN 
          '<p><strong>Admin Notes:</strong> ' || NEW.admin_notes || '</p>' 
        ELSE '' END || '
      </div>
      ' || CASE WHEN NEW.status = 'approved' THEN
        '<p>🎉 Your time off has been approved! Enjoy your leave.</p>'
      ELSE
        '<p>If you have any questions about this decision, please contact your administrator.</p>'
      END || '
    ';
    
    INSERT INTO email_queue (
      recipient_email,
      subject,
      body_html,
      notification_type,
      related_id
    ) VALUES (
      user_email,
      status_emoji || ' Leave request ' || NEW.status || ': ' || NEW.start_date || ' to ' || NEW.end_date,
      email_template_wrapper(
        status_emoji || ' Leave Request ' || UPPER(NEW.status),
        email_content,
        '👉 View Leave Calendar',
        base_url || '/leave-calendar'
      ),
      'leave_' || NEW.status,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to send email notification to admins for new leave requests
CREATE OR REPLACE FUNCTION send_email_leave_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  requester_name TEXT;
  requester_email TEXT;
  base_url TEXT;
  email_content TEXT;
BEGIN
  -- Get configuration
  base_url := current_setting('app.base_url', true);
  IF base_url IS NULL THEN
    base_url := 'http://localhost:5173';
  END IF;
  
  -- Get requester details
  requester_name := get_user_display_name(NEW.user_id);
  SELECT email INTO requester_email FROM auth.users WHERE id = NEW.user_id;
  
  -- Build email content
  email_content := '
    <p>👤 <strong>' || requester_name || '</strong> (' || requester_email || ') has submitted a new leave request that requires your approval:</p>
    <div class="info-box">
      <p><strong>Leave Type:</strong> ' || UPPER(NEW.leave_type) || '</p>
      <p><strong>Duration:</strong> ' || NEW.start_date || ' to ' || NEW.end_date || '</p>
      <p><strong>Total Days:</strong> ' || (NEW.end_date::date - NEW.start_date::date + 1) || ' days</p>
      ' || CASE WHEN NEW.reason IS NOT NULL THEN 
        '<p><strong>Reason:</strong> ' || NEW.reason || '</p>' 
      ELSE '' END || '
    </div>
    <p>Please review this request and take appropriate action.</p>
  ';
  
  -- Notify all admins
  FOR admin_record IN 
    SELECT ur.user_id, au.email 
    FROM user_roles ur
    JOIN auth.users au ON ur.user_id = au.id
    WHERE ur.role = 'admin'
  LOOP
    INSERT INTO email_queue (
      recipient_email,
      subject,
      body_html,
      notification_type,
      related_id
    ) VALUES (
      admin_record.email,
      '📅 New leave request from ' || requester_name,
      email_template_wrapper(
        '📅 New Leave Request Pending Approval',
        email_content,
        '👉 Review Request',
        base_url || '/leave-calendar'
      ),
      'leave_request',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
DROP TRIGGER IF EXISTS trigger_email_issue_assignment ON issue_assignees;
CREATE TRIGGER trigger_email_issue_assignment
  AFTER INSERT ON issue_assignees
  FOR EACH ROW
  EXECUTE FUNCTION send_email_issue_assignment();

DROP TRIGGER IF EXISTS trigger_email_issue_comment ON issue_comments;
CREATE TRIGGER trigger_email_issue_comment
  AFTER INSERT ON issue_comments
  FOR EACH ROW
  EXECUTE FUNCTION send_email_issue_comment();

DROP TRIGGER IF EXISTS trigger_email_leave_status ON leave_requests;
CREATE TRIGGER trigger_email_leave_status
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION send_email_leave_status();

DROP TRIGGER IF EXISTS trigger_email_leave_request ON leave_requests;
CREATE TRIGGER trigger_email_leave_request
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION send_email_leave_request();

-- Verify the setup
SELECT 'Enhanced email notification system created successfully!' as message;
SELECT 'Beautiful email templates are now active!' as note;

