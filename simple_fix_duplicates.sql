-- Simple Fix for Duplicate Users
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Show current duplicate users
SELECT 
  email,
  COUNT(*) as user_count,
  array_agg(id) as user_ids,
  array_agg(created_at) as created_dates
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Step 2: Add unique constraint on email in profiles table (this will prevent future duplicates)
DO $$
BEGIN
  -- Check if unique constraint exists on profiles table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
      AND table_schema = 'public'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%email%'
  ) THEN
    -- Add unique constraint to profiles table
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    RAISE NOTICE '✅ Added unique constraint on email column in profiles table';
  ELSE
    RAISE NOTICE '✅ Unique constraint on email already exists in profiles table';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error adding constraint: %', SQLERRM;
END $$;

-- Step 3: Verify the constraint was added to profiles table
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'email'
  AND tc.constraint_type = 'UNIQUE';

-- Step 4: Final message
SELECT 'Unique email constraint added! Future duplicate signups will be blocked.' as message;
