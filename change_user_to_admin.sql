-- =====================================================
-- CHANGE USER ROLE TO ADMIN
-- =====================================================

-- This script changes the role of godundergod100@gmail.com from 'student' to 'admin'
-- Run this in your Supabase SQL Editor to test admin functionality

-- Step 1: Check current user role
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'godundergod100@gmail.com';

-- Step 2: Update the user role to admin
UPDATE profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'godundergod100@gmail.com';

-- Step 3: Verify the change was successful
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'godundergod100@gmail.com';

-- Step 4: Check if there are any other admin users (optional)
SELECT 
    email,
    role,
    created_at
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- If you need to revert the change, uncomment and run this:
/*
UPDATE profiles 
SET 
    role = 'student',
    updated_at = NOW()
WHERE email = 'godundergod100@gmail.com';
*/
