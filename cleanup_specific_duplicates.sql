-- =====================================================
-- CLEANUP SPECIFIC DUPLICATE EMAIL
-- =====================================================

-- This script will clean up the duplicate email that's preventing the unique constraint

-- Step 1: Show the specific duplicate email
SELECT 
    id,
    name,
    email,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'colourfulrhythmmbe@gmail.com'
ORDER BY created_at DESC;

-- Step 2: Show all duplicate emails in the system
SELECT 
    email,
    COUNT(*) as profile_count,
    array_agg(id) as profile_ids,
    array_agg(created_at) as created_dates,
    array_agg(name) as names
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

-- Step 3: Show what will be removed (keeping the newest profile for each email)
SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    'Will be removed (older duplicate)' as action
FROM profiles p
JOIN (
    SELECT email, MAX(created_at) as max_created_at
    FROM profiles
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates ON p.email = duplicates.email
WHERE p.created_at < duplicates.max_created_at
ORDER BY p.email, p.created_at;

-- =====================================================
-- ACTUAL CLEANUP (UNCOMMENT TO RUN)
-- =====================================================

-- Step 4: Remove duplicate profiles (keep the newest one for each email)
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

-- Step 5: Verify duplicates are gone
/*
SELECT 
    email,
    COUNT(*) as profile_count
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;

-- Should return no results if duplicates were fixed
*/

-- Step 6: Now you can add the unique constraint
/*
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
*/
