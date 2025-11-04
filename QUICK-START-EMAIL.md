# ⚡ Quick Start: Email Notifications (5 Minutes)

The fastest way to get email notifications working.

---

## ✅ Prerequisites Checklist

- [ ] Supabase account created
- [ ] Resend account created (free)
- [ ] Domain verified in Resend (or use test domain)

---

## 🚀 5-Minute Setup

### 1️⃣ Get Your API Keys (2 min)

**Resend:**
1. Go to https://resend.com → API Keys
2. Create new key, copy it: `re_xxxxxxxxxxxx`

**Supabase:**
1. Project Settings → API
2. Copy `service_role` key: `eyJxxxxxxxxxxxxx`
3. Copy `anon/public` key: `eyJxxxxxxxxxxxxx`
4. Copy Project URL: `https://xxxxx.supabase.co`

### 2️⃣ Run Database Setup (1 min)

1. Supabase Dashboard → SQL Editor
2. Run this file: `database/create-email-notification-system.sql`
3. Click **RUN**

### 3️⃣ Enable HTTP Extension (30 sec)

In SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
```

### 4️⃣ Deploy Edge Function (1 min)

**Via Supabase Dashboard:**
1. Edge Functions → **New Function**
2. Name: `send-notification-email`
3. Copy code from: `supabase/functions/send-notification-email/index.ts`
4. Deploy

**OR via CLI:**
```bash
supabase functions deploy send-notification-email
```

### 5️⃣ Set Edge Function Secrets (30 sec)

Edge Functions → send-notification-email → Settings → Add secrets:

```
RESEND_API_KEY=re_your_key_here
FROM_EMAIL=noreply@yourdomain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJyour_service_key_here
```

### 6️⃣ Configure Database (30 sec)

Run in SQL Editor:

```sql
-- Replace with your actual values
ALTER DATABASE postgres SET app.base_url = 'http://localhost:5173';
ALTER DATABASE postgres SET app.edge_function_url = 'https://YOUR-PROJECT.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.service_role_key = 'YOUR-SERVICE-ROLE-KEY';
```

### 7️⃣ Update Frontend .env (30 sec)

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:5173
```

---

## 🧪 Test It!

### Test Issue Assignment Email:
1. Login as admin
2. Go to Issues page
3. Assign an issue to a user
4. ✅ User receives email!

### Test Leave Request Email:
1. Login as user
2. Go to Leave Calendar
3. Request leave
4. ✅ Admin receives email!

---

## 🔍 Verify Setup

Run in SQL Editor:
```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Check if triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE 'on_%';

-- Check configuration
SELECT 
  current_setting('app.base_url') as base_url,
  current_setting('app.edge_function_url') as edge_url;

-- View sent emails
SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 5;
```

---

## ❌ Troubleshooting

**No emails sending?**
```sql
-- Check Edge Function logs in Supabase Dashboard
-- Verify all secrets are set in Edge Function settings
```

**"pg_net extension not found"**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

**Still not working?**
- See full guide: `EMAIL-SETUP-GUIDE.md`
- Check Edge Function logs
- Verify Resend dashboard for errors

---

## 💡 What Happens Next?

✅ When admin assigns issue → User gets email
✅ When admin comments → Assigned user gets email  
✅ When user requests leave → Admin gets email

All automatic! No code needed! 🎉

---

## 📈 Free Tier Limits

- ✅ **3,000 emails/month** (Resend)
- ✅ **500K function calls/month** (Supabase)
- ✅ **$0 cost** for most apps

---

**Total Setup Time: ~5 minutes** ⏱️

Need help? See: `EMAIL-SETUP-GUIDE.md`

