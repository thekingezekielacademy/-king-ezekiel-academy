-- Test the create_profile function
-- Run this in Supabase Dashboard > SQL Editor to verify everything is working

-- Check if the phone column exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the create_profile function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_profile' 
  AND routine_schema = 'public';

-- Test the function with sample data (this will create a test profile)
SELECT create_profile(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Test User',
  'test@example.com',
  NULL, -- phone
  'student'
);

-- Check if the test profile was created
SELECT * FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Clean up test data
DELETE FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
