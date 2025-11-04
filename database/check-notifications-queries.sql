-- =====================================================
-- Corrected Queries to Check Notifications System
-- =====================================================

-- 1. Check recent notifications (in-app)
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
ORDER BY n.created_at DESC
LIMIT 10;

-- 2. Check recent issue assignments (CORRECTED - uses assigned_at)
SELECT 
  ia.id,
  ia.issue_id,
  ia.user_id,
  ia.assigned_at,
  ia.assigned_by,
  i.title as issue_title,
  u.email as assignee_email
FROM issue_assignees ia
JOIN issues i ON i.id = ia.issue_id
JOIN auth.users u ON u.id = ia.user_id
ORDER BY ia.assigned_at DESC
LIMIT 10;

-- 3. Check who assigned what to whom
SELECT 
  ia.assigned_at,
  i.title as issue_title,
  assignee.email as assignee_email,
  assigner.email as assigned_by_email
FROM issue_assignees ia
JOIN issues i ON i.id = ia.issue_id
JOIN auth.users assignee ON assignee.id = ia.user_id
LEFT JOIN auth.users assigner ON assigner.id = ia.assigned_by
ORDER BY ia.assigned_at DESC
LIMIT 10;

-- 4. Count notifications by user
SELECT 
  u.email,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE n.read = false) as unread_count
FROM notifications n
JOIN auth.users u ON u.id = n.user_id
GROUP BY u.email
ORDER BY total_notifications DESC;

-- 5. Count assignments by issue
SELECT 
  i.id as issue_id,
  i.title as issue_title,
  COUNT(ia.user_id) as assignee_count,
  STRING_AGG(u.email, ', ') as assignees
FROM issues i
LEFT JOIN issue_assignees ia ON ia.issue_id = i.id
LEFT JOIN auth.users u ON u.id = ia.user_id
GROUP BY i.id, i.title
ORDER BY i.id DESC
LIMIT 20;

