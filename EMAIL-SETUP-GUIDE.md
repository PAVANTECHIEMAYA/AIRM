# 📧 Email Notification System Setup Guide

Complete guide to set up email notifications using **Supabase Edge Functions + Resend** (100% FREE for small-medium apps).

---

## 🎯 What You'll Get

✅ **Automatic emails when:**
- Admin assigns an issue to a user
- Admin comments on an issue
- User requests leave approval

✅ **Professional HTML email templates**
✅ **Free tier: 3,000 emails/month**
✅ **Server-side security**
✅ **Production-ready**

---

## 📋 Prerequisites

- Supabase account (free tier)
- Resend account (free tier - 3,000 emails/month)
- Supabase CLI installed (optional but recommended)
- Domain for email (or use Resend's test domain for development)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address
4. Add and verify your domain (or use the provided test domain for testing)

### Step 2: Get Resend API Key

1. In Resend Dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "TechieMaya Production")
4. Copy the API key (starts with `re_`)
5. **Save it securely** - you won't see it again!

### Step 3: Configure Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script: `database/create-email-notification-system.sql`
4. This creates:
   - Email notifications table
   - Database triggers for auto-sending emails
   - Helper functions

### Step 4: Deploy Edge Function

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy send-notification-email
```

#### Option B: Manual Deployment via Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **New Function**
3. Name it: `send-notification-email`
4. Copy the code from `supabase/functions/send-notification-email/index.ts`
5. Click **Deploy**

### Step 5: Set Edge Function Environment Variables

In Supabase Dashboard > **Edge Functions** > **send-notification-email** > **Settings**:

Add these secrets:

```
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=TechieMaya Notifications <notifications@yourdomain.com>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To find your Service Role Key:**
- Supabase Dashboard > **Project Settings** > **API** > Copy `service_role` key

### Step 6: Configure Database Settings

Run these SQL commands in Supabase SQL Editor:

```sql
-- Set your application URL (where users will click links in emails)
ALTER DATABASE postgres SET app.base_url = 'https://yourdomain.com';

-- For development:
-- ALTER DATABASE postgres SET app.base_url = 'http://localhost:5173';

-- Set your Edge Function URL
ALTER DATABASE postgres SET app.edge_function_url = 'https://your-project.supabase.co/functions/v1';

-- Set Service Role Key for database triggers
ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key-here';
```

### Step 7: Update Frontend Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=https://yourdomain.com
```

### Step 8: Enable Supabase HTTP Extension (Required!)

The triggers use `net.http_post` to call the Edge Function. Enable it:

1. Go to **Database** > **Extensions** in Supabase Dashboard
2. Search for **http** or **pg_net**
3. Click **Enable** on the `pg_net` extension

OR run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
```

---

## 🧪 Testing the System

### Test 1: Issue Assignment Email

1. Go to the **Issues** page
2. Create or edit an issue
3. Assign it to a user
4. The assigned user should receive an email!

### Test 2: Issue Comment Email

1. Go to an assigned issue
2. Add a comment
3. The assigned user should receive an email notification!

### Test 3: Leave Request Email

1. As a regular user, go to **Leave Calendar**
2. Request leave
3. Admin should receive an email!

### Check Email Logs

View sent emails in Supabase:

```sql
SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 10;
```

Or check the Resend dashboard for delivery status.

---

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Check Edge Function Logs:**
   - Supabase Dashboard > Edge Functions > send-notification-email > Logs

2. **Verify Database Extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

3. **Check Configuration:**
   ```sql
   SELECT current_setting('app.base_url');
   SELECT current_setting('app.edge_function_url');
   -- Should NOT be empty
   ```

4. **Verify Triggers:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
   ```

5. **Test Edge Function Directly:**
   ```bash
   curl -X POST 'https://your-project.supabase.co/functions/v1/send-notification-email' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "type": "issueAssigned",
       "data": {
         "to_email": "test@example.com",
         "assignee_name": "John Doe",
         "assigned_by_name": "Admin",
         "issue_id": "123",
         "issue_title": "Test Issue",
         "app_url": "http://localhost:5173"
       }
     }'
   ```

### Common Issues

**"Missing Supabase environment variables"**
- Make sure you set all Edge Function secrets

**"Resend API error: 403"**
- Invalid API key, regenerate in Resend dashboard

**"FROM_EMAIL not verified"**
- Verify your domain in Resend dashboard
- Or use their test domain for development

**Triggers not firing**
- Check that pg_net extension is enabled
- Verify database configuration settings are set
- Check trigger is created: `\df notify_*` in psql

---

## 💰 Cost Breakdown

### FREE Tier Limits:
- **Resend**: 3,000 emails/month, 100 emails/day
- **Supabase Edge Functions**: 500,000 invocations/month
- **Supabase Database**: 500MB, unlimited API requests

### Typical Usage:
- Small team (10 users): ~200-500 emails/month
- Medium team (50 users): ~1,000-2,500 emails/month
- **You'll stay in FREE tier easily!** 💯

---

## 🎨 Customizing Email Templates

Edit email templates in: `supabase/functions/send-notification-email/index.ts`

Each template has:
- **Subject line**
- **HTML body with inline CSS**
- **Dynamic data placeholders**

Example:
```typescript
issueAssigned: (data: any) => ({
  subject: `🎯 New Issue Assigned: ${data.issue_title}`,
  html: `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML here -->
    </html>
  `
})
```

After editing, redeploy:
```bash
supabase functions deploy send-notification-email
```

---

## 📊 Monitoring

### View Email Stats

```sql
-- Total emails sent
SELECT COUNT(*) FROM email_notifications;

-- Emails by type
SELECT notification_type, COUNT(*) 
FROM email_notifications 
GROUP BY notification_type;

-- Recent emails
SELECT 
  notification_type,
  recipient_email,
  subject,
  created_at,
  status
FROM email_notifications 
ORDER BY created_at DESC 
LIMIT 20;
```

### Resend Dashboard
- Real-time delivery status
- Bounce and complaint tracking
- Email preview
- Analytics

---

## 🔐 Security Best Practices

✅ **Never commit API keys** - Use environment variables
✅ **Use Row Level Security** - Already configured in the SQL
✅ **Service Role Key** - Keep secret, never expose to frontend
✅ **Verify email ownership** - Only send to authenticated users
✅ **Rate limiting** - Resend has built-in protection

---

## 🚀 Going to Production

### 1. Verify Your Domain in Resend
- Add DNS records (SPF, DKIM)
- Wait for verification (usually instant)

### 2. Update FROM_EMAIL
```
FROM_EMAIL=TechieMaya <noreply@yourdomain.com>
```

### 3. Update app.base_url
```sql
ALTER DATABASE postgres SET app.base_url = 'https://yourdomain.com';
```

### 4. Monitor Email Deliverability
- Check spam score in Resend
- Monitor bounce rates
- Keep lists clean

---

## 📚 Additional Features You Can Add

### 1. Email Preferences
Allow users to control notification settings:
```sql
ALTER TABLE profiles ADD COLUMN email_notifications JSONB DEFAULT '{
  "issue_assigned": true,
  "issue_comments": true,
  "leave_updates": true
}'::jsonb;
```

### 2. Email Digest
Send daily/weekly summaries instead of instant emails

### 3. SMS Notifications
Integrate Twilio for urgent notifications

### 4. Slack Integration
Use Slack webhooks for team notifications

---

## ❓ Support

**Issues?**
- Check Supabase Edge Function logs
- Check Resend delivery logs
- Review this guide
- Check Supabase documentation: https://supabase.com/docs/guides/functions

**Success?** 
Enjoy your professional email notification system! 🎉

---

## 📝 Quick Reference

| Setting | Location | Example |
|---------|----------|---------|
| Resend API Key | Edge Function Secrets | `re_xxx...` |
| Service Role Key | Supabase API Settings | `eyJxxx...` |
| FROM_EMAIL | Edge Function Secrets | `noreply@domain.com` |
| app.base_url | Database Config | `https://yourdomain.com` |
| Edge Function URL | Database Config | `https://proj.supabase.co/functions/v1` |

---

**Built with ❤️ for TechieMaya Timesheet Application**

