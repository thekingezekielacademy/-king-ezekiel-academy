-- =====================================================
-- QUICK FIX FOR DUPLICATE EMAILS
-- =====================================================

-- This script will quickly fix the duplicate email issue
-- Run this in your Supabase SQL Editor

-- Step 1: Remove duplicate profiles (keep the newest one)
DELETE FROM profiles 
WHERE id IN (
    SELECT p.id
    FROM profiles p
    JOIN (
        SELECT email, MAX(created_at) as max_created_at
        FROM profiles
        GROUP BY email
        HAVING COUNT(*) > 1
    ) duplicates ON p.email = duplicates.email
    WHERE p.created_at < duplicates.max_created_at
);

-- Step 2: Verify duplicates are gone
SELECT 
    email,
    COUNT(*) as profile_count
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

-- Step 3: Add the unique constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Step 4: Verify the constraint was added
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
  AND constraint_type = 'UNIQUE'
  AND constraint_name LIKE '%email%';
