-- =====================================================
-- Database Configuration for Email Notifications
-- Run this in Supabase SQL Editor (Step 5)
-- =====================================================

-- Enable pg_net extension (REQUIRED for email notifications)
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Configure application settings
ALTER DATABASE postgres SET app.base_url = 'http://localhost:5175';
ALTER DATABASE postgres SET app.edge_function_url = 'https://uvvrjbatlhzfwcygitjk.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2dnJqYmF0bGh6ZndjeWdpdGprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkzODIxNCwiZXhwIjoyMDc2NTE0MjE0fQ.VfmZwvpEGNUTsiSl6_TMTsrgY3aFqfqpPBx1-hwNXLY';

-- Verify configuration
SELECT 
  current_setting('app.base_url') as base_url,
  current_setting('app.edge_function_url') as edge_function_url,
  CASE 
    WHEN current_setting('app.service_role_key') != '' 
    THEN '✓ Service key configured' 
    ELSE '✗ Service key missing' 
  END as service_key_status;

-- Success message
SELECT '✓ Database configuration complete!' as status;

