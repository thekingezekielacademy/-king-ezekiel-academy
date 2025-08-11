-- Clean Up Duplicate Users
-- Run this AFTER running fix_duplicate_users.sql
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Show all duplicate profiles before cleanup
SELECT 
  email,
  COUNT(*) as profile_count,
  array_agg(id) as profile_ids,
  array_agg(created_at) as created_dates
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

-- Step 2: Clean up duplicate profiles (keep the most recent one)
WITH duplicate_profiles AS (
  SELECT 
    email,
    id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM profiles
)
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM duplicate_profiles WHERE rn > 1
);

-- Step 3: Verify cleanup - should show no duplicates
SELECT 
  email,
  COUNT(*) as profile_count
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

-- Step 4: Show final profile count
SELECT COUNT(*) as total_profiles FROM profiles;

-- Step 5: Final message
SELECT 'Duplicate users cleaned up successfully!' as message;
