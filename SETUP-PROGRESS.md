# 🚀 Email Notification Setup Progress

**Date Started:** October 30, 2025

---

## ✅ Completed Steps

- [x] **Step 1: Create Resend Account** ✓
- [x] **Step 2: Get Resend API Key** ✓
  - API Key: `re_L8R5idu2_KZSNPCxtsKYEUsCT7Gngu8oX`
  - Created: Just now
  - Permission: Sending access

- [x] **Step 3: Get Supabase Keys** ✓
  - Project URL: `https://uvvrjbatlhzfwcygitjk.supabase.co`
  - Project Ref: `uvvrjbatlhzfwcygitjk`
  - Anon Key: ✓ Configured
  - Service Role Key: ✓ Configured

- [x] **Configuration Files Created** ✓
  - `.env` - Frontend configuration ✓
  - `DATABASE-CONFIG.sql` - Ready-to-run database setup ✓
  - `EDGE-FUNCTION-SECRETS.md` - Edge Function secrets ✓
  - `READY-TO-RUN-STEPS.md` - Step-by-step guide ✓

---

## 📝 Next Steps (To Complete)

### Step 3: Get Supabase Keys
- [ ] Go to Supabase Dashboard → Project Settings → API
- [ ] Copy Project URL
- [ ] Copy Anon/Public Key
- [ ] Copy Service Role Key

**Fill in your Supabase details here:**
```
SUPABASE_URL=https://_____.supabase.co
SUPABASE_ANON_KEY=eyJ_____
SUPABASE_SERVICE_ROLE_KEY=eyJ_____
```

### Step 4: Enable pg_net Extension
- [ ] Go to Supabase SQL Editor
- [ ] Run this SQL:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
```

### Step 5: Run Database Setup
- [ ] In Supabase SQL Editor
- [ ] Open file: `database/create-email-notification-system.sql`
- [ ] Copy and paste the entire file
- [ ] Click **RUN**
- [ ] Verify no errors

### Step 6: Run Issue Triggers Update
- [ ] In Supabase SQL Editor
- [ ] Open file: `database/update-email-notifications-for-issues.sql`
- [ ] Copy and paste the entire file
- [ ] Click **RUN**
- [ ] Should see trigger verification results

### Step 7: Configure Database Settings
- [ ] In Supabase SQL Editor, run:
```sql
-- Replace with your actual values
ALTER DATABASE postgres SET app.base_url = 'http://localhost:5175';
ALTER DATABASE postgres SET app.edge_function_url = 'https://YOUR-PROJECT-REF.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.service_role_key = 'YOUR-SERVICE-ROLE-KEY';
```

### Step 8: Deploy Edge Function

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref YOUR-PROJECT-REF

# Deploy
supabase functions deploy send-notification-email
```

**Option B: Via Supabase Dashboard**
- [ ] Go to Edge Functions → Create Function
- [ ] Name: `send-notification-email`
- [ ] Copy code from: `supabase/functions/send-notification-email/index.ts`
- [ ] Deploy

### Step 9: Set Edge Function Secrets
- [ ] Go to Edge Functions → send-notification-email → Settings
- [ ] Add these secrets:

```
RESEND_API_KEY=re_L8R5idu2_KZSNPCxtsKYEUsCT7Gngu8oX
FROM_EMAIL=noreply@yourdomain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJyour_service_key
```

### Step 10: Update Frontend .env
- [ ] Create `.env` file in project root
- [ ] Add:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5175
```

### Step 11: Test!
- [ ] Restart dev server: `npm run dev`
- [ ] Login as admin
- [ ] Assign an issue to a user
- [ ] Check if email arrives! 📧

---

## 📊 Configuration Summary

Once complete, you'll have:

| Item | Value | Status |
|------|-------|--------|
| Resend API Key | `re_L8R5...` | ✅ Done |
| Resend Domain | techiemaya.com or test domain | ⏳ Pending |
| FROM_EMAIL | `___@___` | ⏳ Pending |
| Supabase URL | `https://___` | ⏳ Pending |
| Supabase Anon Key | `eyJ___` | ⏳ Pending |
| Service Role Key | `eyJ___` | ⏳ Pending |
| pg_net Extension | Enabled | ⏳ Pending |
| Database Triggers | Created | ⏳ Pending |
| Edge Function | Deployed | ⏳ Pending |
| Edge Secrets | Configured | ⏳ Pending |

---

## 🧪 Testing Checklist

After setup:

- [ ] **Test 1**: Assign issue → User gets email
- [ ] **Test 2**: Comment on issue → User gets email
- [ ] **Test 3**: Request leave → Admin gets email

**Verify emails in:**
- [ ] Your inbox
- [ ] Resend dashboard (Emails tab)
- [ ] Supabase database:
```sql
SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 5;
```

---

## 🐛 Troubleshooting

If something doesn't work:

1. **Check Edge Function Logs**
   - Supabase → Edge Functions → send-notification-email → Logs

2. **Verify Database Extension**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

3. **Check Triggers**
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'on_%';
```

4. **Review Resend Dashboard**
   - Check for delivery errors
   - Verify domain status

---

## 📚 Reference Docs

- **Quick Guide**: `QUICK-START-EMAIL.md`
- **Detailed Setup**: `EMAIL-SETUP-GUIDE.md`
- **Production Deploy**: `DEPLOYMENT-CHECKLIST.md`
- **Technical Overview**: `EMAIL-NOTIFICATION-SUMMARY.md`

---

## ✨ Success Criteria

You're done when:

✅ All steps above are checked  
✅ No errors in Edge Function logs  
✅ Test emails arrive in inbox  
✅ Emails look professional  
✅ Links in emails work  

---

**Current Status**: 2/11 steps complete (18%)

**Next Action**: Get your Supabase keys from the dashboard!

Good luck! 🚀

