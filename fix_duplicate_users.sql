-- =====================================================
-- FIX DUPLICATE USERS BY EMAIL
-- =====================================================

-- This script will fix duplicate users by keeping the newest one
-- and removing the older duplicates

-- Step 1: Show current duplicates (run this first to see what will be fixed)
SELECT 
    email,
    COUNT(*) as user_count,
    array_agg(id) as user_ids,
    array_agg(created_at) as created_dates
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Step 2: Show which profiles will be removed (older duplicates)
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    'Will be removed (older duplicate)' as status
FROM profiles p
JOIN (
    SELECT email, MAX(created_at) as max_created_at
    FROM profiles
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates ON p.email = duplicates.email
WHERE p.created_at < duplicates.max_created_at
ORDER BY p.email, p.created_at;

-- Step 3: Show which auth.users will be removed (older duplicates)
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    'Will be removed (older duplicate)' as status
FROM auth.users u
JOIN (
    SELECT email, MAX(created_at) as max_created_at
    FROM auth.users
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates ON u.email = duplicates.email
WHERE u.created_at < duplicates.max_created_at
ORDER BY u.email, u.created_at;

-- =====================================================
-- ACTUAL CLEANUP (UNCOMMENT TO RUN)
-- =====================================================

-- Step 4: Remove duplicate profiles (keep newest)
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

-- Step 5: Remove duplicate auth.users (keep newest)
/*
DELETE FROM auth.users 
WHERE id IN (
    SELECT u.id
    FROM auth.users u
    JOIN (
        SELECT email, MAX(created_at) as max_created_at
        FROM auth.users
        GROUP BY email
        HAVING COUNT(*) > 1
    ) duplicates ON u.email = duplicates.email
    WHERE u.created_at < duplicates.max_created_at
);
*/

-- Step 6: Verify the fix (run this after cleanup)
/*
SELECT 
    email,
    COUNT(*) as user_count
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- Should return no results if duplicates were fixed
*/
