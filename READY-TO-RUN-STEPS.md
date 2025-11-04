# 🚀 Ready-to-Run Setup Steps

**All your keys are configured!** Just follow these steps in order.

---

## ✅ STEP 1: Enable pg_net Extension & Configure Database

**Where:** Supabase Dashboard → SQL Editor

**What to do:**
1. Click **"New Query"**
2. Copy and paste the file: **`DATABASE-CONFIG.sql`** (I created this for you!)
3. Click **RUN**

**Expected result:**
```
✓ Extension enabled
✓ Configuration verified
✓ Database configuration complete!
```

---

## ✅ STEP 2: Create Email Notification System

**Where:** Still in SQL Editor

**What to do:**
1. Click **"New Query"**
2. Open file: `database/create-email-notification-system.sql`
3. **Copy ALL the content** (300 lines)
4. Paste and click **RUN**

**Expected result:**
```
Success - email_notifications table created
Labels created: 7
Issues created: 0
```

---

## ✅ STEP 3: Create Email Triggers

**Where:** Still in SQL Editor

**What to do:**
1. Click **"New Query"**
2. Open file: `database/update-email-notifications-for-issues.sql`
3. **Copy ALL the content** (280 lines)
4. Paste and click **RUN**

**Expected result:**
Table showing 3 triggers:
- on_issue_assigned
- on_issue_comment  
- on_leave_request

---

## ✅ STEP 4: Deploy Edge Function

### Option A: Supabase Dashboard (Easier)

1. Go to **Edge Functions** in Supabase
2. Click **"Create a new function"**
3. Name: `send-notification-email`
4. Open file: `supabase/functions/send-notification-email/index.ts`
5. Copy ALL content (275 lines)
6. Paste into editor
7. Click **Deploy**

### Option B: Supabase CLI (Recommended)

In terminal:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref uvvrjbatlhzfwcygitjk

# Deploy
supabase functions deploy send-notification-email
```

**Expected result:**
```
✓ Function deployed successfully
```

---

## ✅ STEP 5: Configure Edge Function Secrets

**Where:** Supabase Dashboard → Edge Functions → send-notification-email → Settings

**What to do:**
1. Open the file I created: **`EDGE-FUNCTION-SECRETS.md`**
2. Follow the instructions to add all 4 secrets
3. Click **Save**

**The 4 secrets:**
- ✓ RESEND_API_KEY
- ✓ FROM_EMAIL
- ✓ SUPABASE_URL
- ✓ SUPABASE_SERVICE_ROLE_KEY

---

## ✅ STEP 6: Restart Your Dev Server

**Where:** Your terminal

**What to do:**
```bash
# If server is running, stop it (Ctrl+C)

# Navigate to project
cd VCP_Automation-TechieMaya-Timesheet

# Start dev server
npm run dev
```

**Expected result:**
```
VITE ready in X ms
Local: http://localhost:5175/
```

---

## ✅ STEP 7: TEST IT! 🎉

### Test 1: Issue Assignment Email

1. Open http://localhost:5175
2. Login (create account if needed)
3. Go to **Issues** page
4. Create or edit an issue
5. Assign it to a user
6. **Check email** - user should receive notification!

### Test 2: Verify in Database

In Supabase SQL Editor:
```sql
SELECT * FROM email_notifications 
ORDER BY created_at DESC 
LIMIT 5;
```

Should show your sent email!

### Test 3: Check Resend Dashboard

1. Go to https://resend.com/emails
2. You should see your sent email
3. Click to view details

---

## 🎯 Summary

**Files I created for you:**
- ✅ `.env` - Frontend configuration (already has your keys!)
- ✅ `DATABASE-CONFIG.sql` - Ready-to-run database setup
- ✅ `EDGE-FUNCTION-SECRETS.md` - Copy-paste secrets
- ✅ `READY-TO-RUN-STEPS.md` - This file!

**What you need to do:**
1. Run `DATABASE-CONFIG.sql` in SQL Editor (1 min)
2. Run `create-email-notification-system.sql` (1 min)
3. Run `update-email-notifications-for-issues.sql` (1 min)
4. Deploy Edge Function (2 min)
5. Add 4 secrets to Edge Function (2 min)
6. Restart server (30 sec)
7. Test! (1 min)

**Total time: ~10 minutes**

---

## 🐛 Troubleshooting

### No emails sending?

**Check Edge Function logs:**
- Supabase → Edge Functions → send-notification-email → Logs

**Check for errors:**
```sql
-- Should show pg_net extension
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Should show 3 triggers
SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'on_%';
```

**Check Resend:**
- Go to https://resend.com/emails
- Look for errors or bounce messages

---

## ✅ Success Indicators

You'll know it's working when:

✓ SQL queries all succeed without errors  
✓ Edge Function deploys successfully  
✓ All 4 secrets are configured  
✓ Dev server starts on port 5175  
✓ Assigning an issue sends email  
✓ Email appears in inbox  
✓ Email appears in Resend dashboard  
✓ Email logged in `email_notifications` table  

---

**You're all set! Start with STEP 1 above.** 🚀

**Everything is pre-configured with your actual keys - just copy and paste!**

