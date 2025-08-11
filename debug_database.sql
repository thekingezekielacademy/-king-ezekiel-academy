-- Debug Database Structure
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Check what tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth') 
ORDER BY table_schema, table_name;

-- Step 2: Check the profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 3: Check if the create_profile function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_profile' 
  AND routine_schema = 'public';

-- Step 4: Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 5: Check if there are any users in auth.users
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Step 6: Check if there are any profiles
SELECT COUNT(*) as profiles_count FROM profiles;

-- Step 7: Check the foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profiles';
