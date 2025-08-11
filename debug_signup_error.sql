-- Debug Signup Database Error
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Check auth.users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth'
ORDER BY ordinal_position;

-- Step 2: Check for any triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Step 3: Check if there are any RLS policies on auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'auth';

-- Step 4: Check for any database errors in the logs
-- (This might not show much in the dashboard, but worth checking)
SELECT 
  log_time,
  log_level,
  message
FROM pg_stat_statements 
WHERE query LIKE '%users%' 
ORDER BY log_time DESC 
LIMIT 10;

-- Step 5: Check if the profiles table has any constraints that might interfere
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
  AND constraint_type IN ('FOREIGN KEY', 'CHECK', 'UNIQUE');

-- Step 6: Test inserting a simple user manually (this will show the exact error)
-- WARNING: This is just for testing - don't use in production
DO $$
BEGIN
  -- Try to insert a test user to see what error occurs
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('testpassword', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Test User"}',
    false,
    '',
    '',
    '',
    ''
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting user: %', SQLERRM;
END $$;
