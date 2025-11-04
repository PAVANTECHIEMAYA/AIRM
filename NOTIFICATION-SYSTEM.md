# 🔔 Notification System

## Overview

When an admin assigns an issue to a user, **two types of notifications** are automatically sent:

1. **In-App Notification** (Bell Icon) - Always works, no setup needed
2. **Email Notification** - Requires Edge Function setup (optional)

---

## 📋 How It Works

### When Admin Assigns an Issue:

1. Admin goes to an issue detail page
2. Admin selects a user from the "Assignees" dropdown
3. System inserts a record into `issue_assignees` table
4. **Two triggers automatically fire:**

   **Trigger 1: `trigger_notify_issue_assignment`**
   - Creates in-app notification in `notifications` table
   - User sees notification in bell icon (top right)
   - Works immediately, no configuration needed

   **Trigger 2: `on_issue_assigned_email`**
   - Sends email via Supabase Edge Function
   - Requires Edge Function setup (see below)

---

## ✅ Setup Instructions

### Step 1: Run Database Setup (Required for In-App Notifications)

Run this SQL file in Supabase SQL Editor:
```
database/setup-complete-notification-system.sql
```

This creates:
- `notifications` table
- Trigger for in-app notifications (always works)
- Trigger for email notifications (optional)

### Step 2: Enable Email Notifications (Optional)

If you want email notifications too:

1. **Deploy Edge Function:**
   - Go to Supabase Dashboard → Edge Functions
   - Deploy `send-notification-email` function
   - See `QUICK-START-EMAIL.md` for details

2. **Set Database Configuration:**
   ```sql
   ALTER DATABASE postgres SET app.edge_function_url = 'https://YOUR-PROJECT.supabase.co/functions/v1';
   ALTER DATABASE postgres SET app.service_role_key = 'YOUR-SERVICE-ROLE-KEY';
   ALTER DATABASE postgres SET app.base_url = 'http://localhost:5173';
   ```

3. **Set Edge Function Secrets:**
   - RESEND_API_KEY
   - FROM_EMAIL
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

---

## 🧪 Testing

### Test In-App Notifications (Always Works):

1. Login as admin
2. Go to Issues page
3. Open any issue
4. Assign it to a user
5. **User should see notification in bell icon immediately**

### Test Email Notifications (If Configured):

1. Assign issue to a user (same as above)
2. **User should receive email notification**
3. Check Supabase Edge Function logs if email doesn't arrive

---

## 📊 Current Status

After running the setup script, check triggers:

```sql
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing as timing,
  event_manipulation as event
FROM information_schema.triggers
WHERE event_object_table = 'issue_assignees';
```

You should see:
- `trigger_notify_issue_assignment` ✅ (In-app notifications)
- `on_issue_assigned_email` ✅ (Email notifications)

---

## 🔍 Troubleshooting

### No In-App Notifications?

1. Check if triggers exist:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'issue_assignees';
   ```

2. Verify `notifications` table exists:
   ```sql
   SELECT * FROM notifications LIMIT 1;
   ```

3. Check if notification was created:
   ```sql
   SELECT * FROM notifications 
   ORDER BY created_at DESC LIMIT 5;
   ```

### No Email Notifications?

1. Check Edge Function is deployed
2. Verify database configuration is set:
   ```sql
   SELECT 
     current_setting('app.edge_function_url', true) as edge_url,
     current_setting('app.service_role_key', true) as service_key;
   ```

3. Check Edge Function logs in Supabase Dashboard
4. Verify Edge Function secrets are set

---

## 💡 What Happens Automatically?

✅ **When admin assigns issue → User gets in-app notification** (bell icon)  
✅ **When admin assigns issue → User gets email** (if Edge Function configured)  
✅ **When admin comments → Assigned users get notifications**  
✅ **When user requests leave → Admin gets notifications**

All automatic! No code changes needed! 🎉

