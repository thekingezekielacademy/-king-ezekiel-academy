-- Remove Problematic Triggers
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Check what triggers exist on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Step 2: Drop any triggers we created that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Drop the trigger function if it exists
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 4: Check if there are any other triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- Step 5: Verify the profiles table structure is clean
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 6: Test message
SELECT 'Triggers removed! Try signup again.' as message;
