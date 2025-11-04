# Debugging Timesheet Issue

## Problem
Time clock entries are not appearing in the timesheet after clocking out.

## Steps to Debug

### 1. Check Browser Console
After clocking out, open browser console (F12) and look for:
- `Successfully created timesheet entry:` - means entry was created
- `Error adding to timesheet:` - means there was an error
- Check for any red error messages

### 2. Check Database
Run this query in Supabase SQL Editor:

```sql
-- Check recent timesheet entries
SELECT 
  te.*,
  t.week_start,
  t.user_id,
  u.email
FROM timesheet_entries te
JOIN timesheets t ON t.id = te.timesheet_id
JOIN auth.users u ON u.id = t.user_id
WHERE te.source = 'time_clock'
ORDER BY te.created_at DESC
LIMIT 10;
```

### 3. Check if Timesheet Exists
```sql
-- Check timesheets for current user and week
SELECT 
  t.*,
  COUNT(te.id) as entry_count
FROM timesheets t
LEFT JOIN timesheet_entries te ON te.timesheet_id = t.id
WHERE t.user_id = 'YOUR_USER_ID_HERE'
  AND t.week_start >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY t.id
ORDER BY t.week_start DESC;
```

### 4. Verify Column Names
```sql
-- Check actual column structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'timesheet_entries'
ORDER BY ordinal_position;
```

## Common Issues

1. **No timesheet for current week** - Entry gets created but no timesheet exists
2. **Column name mismatch** - `task` vs `task_title`
3. **RLS Policy blocking insert** - Check RLS policies on timesheet_entries
4. **Week calculation mismatch** - Timesheet uses different week start

## Quick Test

1. Clock in with an issue
2. Clock out immediately (wait a few seconds)
3. Check console for logs
4. Go to Timesheet page and refresh
5. Check database with queries above

