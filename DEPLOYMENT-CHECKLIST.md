# ✅ Email Notification Deployment Checklist

Use this checklist to ensure your email notification system is properly deployed.

---

## 📋 Pre-Deployment

### Account Setup
- [ ] Supabase account created
- [ ] Resend account created
- [ ] Domain added and verified in Resend (or using test domain)

### API Keys Collected
- [ ] Resend API Key: `re_xxxxxxxxxxxx`
- [ ] Supabase Project URL: `https://xxxxx.supabase.co`
- [ ] Supabase Anon Key: `eyJxxxxx...`
- [ ] Supabase Service Role Key: `eyJxxxxx...`

---

## 🗄️ Database Setup

### Step 1: Enable HTTP Extension
- [ ] Run SQL: 
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
```

### Step 2: Create Email Notifications Table
- [ ] Run: `database/create-email-notification-system.sql`
- [ ] Verify: Check that `email_notifications` table exists

### Step 3: Create/Update Triggers
- [ ] Run: `database/update-email-notifications-for-issues.sql`
- [ ] Verify: Check triggers exist:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'on_%';
```

### Step 4: Configure Database Settings
- [ ] Run SQL (replace with your values):
```sql
ALTER DATABASE postgres SET app.base_url = 'https://yourdomain.com';
ALTER DATABASE postgres SET app.edge_function_url = 'https://YOUR-PROJECT.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.service_role_key = 'YOUR-SERVICE-ROLE-KEY';
```

- [ ] Verify settings:
```sql
SELECT 
  current_setting('app.base_url') as base_url,
  current_setting('app.edge_function_url') as edge_url;
```

---

## 🔧 Edge Function Deployment

### Option A: Supabase CLI (Recommended)
- [ ] Install CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref YOUR-PROJECT-REF`
- [ ] Deploy: `supabase functions deploy send-notification-email`

### Option B: Dashboard Manual Deploy
- [ ] Go to: Edge Functions → New Function
- [ ] Name: `send-notification-email`
- [ ] Copy code from: `supabase/functions/send-notification-email/index.ts`
- [ ] Click Deploy

### Edge Function Secrets
- [ ] Set in Dashboard: Edge Functions → send-notification-email → Settings
- [ ] Add secret: `RESEND_API_KEY` = `re_your_key`
- [ ] Add secret: `FROM_EMAIL` = `notifications@yourdomain.com`
- [ ] Add secret: `SUPABASE_URL` = `https://your-project.supabase.co`
- [ ] Add secret: `SUPABASE_SERVICE_ROLE_KEY` = `your-service-key`

### Verify Edge Function
- [ ] Check function is deployed and active
- [ ] Review logs for any errors

---

## 🎨 Frontend Configuration

### Environment Variables
- [ ] Create `.env` file in project root
- [ ] Add:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://yourdomain.com
```

### Build and Deploy
- [ ] Test locally: `npm run dev`
- [ ] Build: `npm run build`
- [ ] Deploy to hosting (Vercel/Netlify/etc.)

---

## 🧪 Testing

### Test 1: Issue Assignment
- [ ] Login as admin
- [ ] Create/edit an issue
- [ ] Assign to a user
- [ ] ✅ Check user receives email
- [ ] ✅ Check email looks correct
- [ ] ✅ Check links work

### Test 2: Issue Comment
- [ ] Go to an assigned issue
- [ ] Add a comment (as admin or another user)
- [ ] ✅ Check assigned user receives email
- [ ] ✅ Verify comment appears in email
- [ ] ✅ Check "View Issue" link works

### Test 3: Leave Request
- [ ] Login as regular user
- [ ] Request leave via Leave Calendar
- [ ] ✅ Check admin receives email
- [ ] ✅ Verify leave details are correct
- [ ] ✅ Check approve/reject links work

### Verify Email Logs
- [ ] Check in Supabase:
```sql
SELECT * FROM email_notifications 
ORDER BY created_at DESC 
LIMIT 10;
```
- [ ] Check Resend dashboard for delivery status
- [ ] Verify no bounces or errors

---

## 🔍 Verification Queries

### Check Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
-- Should return 1 row
```

### Check Triggers
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname IN ('on_issue_assigned', 'on_issue_comment', 'on_leave_request');
-- Should return 3 rows with tgenabled = 'O'
```

### Check Configuration
```sql
SELECT 
  current_setting('app.base_url', true) as base_url,
  current_setting('app.edge_function_url', true) as edge_url,
  current_setting('app.service_role_key', true) != '' as has_service_key;
-- All values should be non-empty
```

### Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('email_notifications', 'issue_assignees', 'issue_comments', 'leave_requests');
-- Should return 4 rows
```

---

## 🚀 Production Checklist

### Domain & Email
- [ ] Domain DNS configured (SPF, DKIM)
- [ ] Domain verified in Resend
- [ ] FROM_EMAIL updated to production domain
- [ ] Test email deliverability

### Security
- [ ] Service role key kept secret
- [ ] Never exposed to frontend
- [ ] Row Level Security policies verified
- [ ] API rate limiting reviewed

### Performance
- [ ] Database indexes in place
- [ ] Edge function response time < 1s
- [ ] Email queue not backing up

### Monitoring
- [ ] Resend dashboard reviewed regularly
- [ ] Edge function logs monitored
- [ ] Email notification table checked for errors
- [ ] Set up alerts for failures (optional)

---

## 📊 Post-Deployment Monitoring

### Daily (First Week)
- [ ] Check Resend dashboard for deliverability
- [ ] Review Edge Function logs
- [ ] Check for any email_notifications with status != 'sent'

### Weekly
- [ ] Review email volume vs. free tier limits
- [ ] Check bounce rates
- [ ] Verify all notification types working

### Monthly
- [ ] Audit email templates for improvements
- [ ] Review and optimize if needed
- [ ] Check for any user complaints

---

## 🐛 Troubleshooting

If emails not sending:

1. **Check Edge Function Logs**
   - Dashboard → Edge Functions → send-notification-email → Logs
   - Look for errors

2. **Verify pg_net Extension**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

3. **Test Edge Function Directly**
```bash
curl -X POST 'https://YOUR-PROJECT.supabase.co/functions/v1/send-notification-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "issueAssigned",
    "data": {
      "to_email": "test@example.com",
      "assignee_name": "Test User",
      "assigned_by_name": "Admin",
      "issue_id": "1",
      "issue_title": "Test Issue",
      "app_url": "https://yourdomain.com"
    }
  }'
```

4. **Check Database Logs**
```sql
SELECT * FROM email_notifications 
WHERE status != 'sent' 
ORDER BY created_at DESC;
```

5. **Verify Triggers Are Enabled**
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE 'on_%';
```

---

## ✨ Success Criteria

- [ ] All 3 email types send successfully
- [ ] Email templates render correctly
- [ ] Links in emails work
- [ ] Emails arrive within 30 seconds
- [ ] No errors in Edge Function logs
- [ ] No errors in Resend dashboard
- [ ] Row Level Security working
- [ ] Users report receiving notifications

---

## 📈 Usage Metrics

Track these to ensure you stay in free tier:

| Metric | Free Tier Limit | Current Usage | Status |
|--------|----------------|---------------|---------|
| Emails/month | 3,000 | ___ | ⬜ |
| Emails/day | 100 | ___ | ⬜ |
| Edge Function calls | 500K/month | ___ | ⬜ |
| Database size | 500MB | ___ | ⬜ |

---

## 🎉 Deployment Complete!

Once all items are checked:
- ✅ Email notification system is live
- ✅ Users will receive automatic notifications
- ✅ Professional email templates
- ✅ $0/month cost (free tier)

**Great job!** 🚀

---

## 📚 Reference Documents

- Setup Guide: `EMAIL-SETUP-GUIDE.md`
- Quick Start: `QUICK-START-EMAIL.md`
- Database Scripts: `database/`
- Edge Function: `supabase/functions/send-notification-email/`

---

**Last Updated:** October 2025
**Deployment Date:** _____________
**Deployed By:** _____________

