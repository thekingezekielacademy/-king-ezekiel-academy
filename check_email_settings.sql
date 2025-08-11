-- Check and Fix Email Confirmation Settings
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Check current auth settings
SELECT 
  name,
  value,
  description
FROM auth.config 
WHERE name LIKE '%email%' OR name LIKE '%confirm%';

-- Step 2: Check if email confirmations are enabled
SELECT 
  CASE 
    WHEN value::boolean = true THEN '✅ Email confirmations are ENABLED'
    WHEN value::boolean = false THEN '❌ Email confirmations are DISABLED'
    ELSE '❓ Email confirmations status UNKNOWN'
  END as email_confirmation_status
FROM auth.config 
WHERE name = 'enable_confirmations';

-- Step 3: Check site URL setting
SELECT 
  name,
  value,
  CASE 
    WHEN value IS NOT NULL THEN '✅ Site URL is set'
    ELSE '❌ Site URL is NOT set'
  END as site_url_status
FROM auth.config 
WHERE name = 'site_url';

-- Step 4: Show all auth configuration
SELECT 
  name,
  value,
  description
FROM auth.config 
ORDER BY name;
