# Edge Function Secrets Configuration

**When:** Step 7 - After deploying the Edge Function
**Where:** Supabase Dashboard → Edge Functions → send-notification-email → Settings

---

## Add These 4 Secrets

Click **"Add new secret"** for each one:

### Secret 1: RESEND_API_KEY
```
Name:  RESEND_API_KEY
Value: re_L8R5idu2_KZSNPCxtsKYEUsCT7Gngu8oX
```

### Secret 2: FROM_EMAIL
```
Name:  FROM_EMAIL
Value: onboarding@resend.dev
```
**Note:** For testing, use `onboarding@resend.dev`  
For production, change to your verified domain: `noreply@yourdomain.com`

### Secret 3: SUPABASE_URL
```
Name:  SUPABASE_URL
Value: https://uvvrjbatlhzfwcygitjk.supabase.co
```

### Secret 4: SUPABASE_SERVICE_ROLE_KEY
```
Name:  SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2dnJqYmF0bGh6ZndjeWdpdGprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkzODIxNCwiZXhwIjoyMDc2NTE0MjE0fQ.VfmZwvpEGNUTsiSl6_TMTsrgY3aFqfqpPBx1-hwNXLY
```

---

## ✅ After Adding All Secrets

Click **Save** and verify you see all 4 secrets listed.

The Edge Function will now be able to:
- ✓ Send emails via Resend
- ✓ Access Supabase database
- ✓ Log email notifications

**Next:** Test the system! (Step 10)

