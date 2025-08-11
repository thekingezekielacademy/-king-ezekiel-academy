-- =====================================================
-- INVESTIGATE AND FIX DUPLICATE USERS
-- =====================================================

-- 1. First, let's see all users in the auth.users table
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Check for duplicate emails in auth.users
SELECT 
    email,
    COUNT(*) as user_count,
    array_agg(id) as user_ids,
    array_agg(created_at) as created_dates
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- 3. Check profiles table for duplicates
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    p.updated_at,
    u.created_at as auth_created_at,
    u.last_sign_in_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 4. Check for orphaned profiles (profiles without auth.users)
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 5. Check for users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- CLEANUP OPTIONS (UNCOMMENT AND RUN AS NEEDED)
-- =====================================================

-- Option A: Remove duplicate profiles (keep the newest one)
-- This will keep the most recently created profile for each email
/*
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
*/

-- Option B: Remove orphaned profiles (profiles without auth.users)
/*
DELETE FROM profiles 
WHERE id IN (
    SELECT p.id
    FROM profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE u.id IS NULL
);
*/

-- Option C: Remove users without profiles (auth.users without profiles)
/*
DELETE FROM auth.users 
WHERE id IN (
    SELECT u.id
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
);
*/

-- Option D: Show what would be deleted before actually deleting
-- Uncomment the section above to see what would be removed
/*
-- This shows what profiles would be removed as duplicates:
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    'Would be removed as duplicate' as action
FROM profiles p
JOIN (
    SELECT email, MAX(created_at) as max_created_at
    FROM profiles
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates ON p.email = duplicates.email
WHERE p.created_at < duplicates.max_created_at
ORDER BY p.email, p.created_at;
*/
