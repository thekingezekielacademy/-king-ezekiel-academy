-- =====================================================
-- PREVENT DUPLICATE USERS IN THE FUTURE
-- =====================================================

-- This script adds constraints and triggers to prevent duplicate users

-- Step 1: Add unique constraint on email in profiles table (if not exists)
DO $$
BEGIN
    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%email%'
    ) THEN
        -- Add unique constraint
        ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on profiles.email column';
    ELSE
        RAISE NOTICE 'Unique constraint on profiles.email already exists';
    END IF;
END $$;

-- Step 2: Create a function to check for existing users before profile creation
CREATE OR REPLACE FUNCTION check_existing_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a profile with this email already exists
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE email = NEW.email 
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'A user with this email already exists';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to prevent duplicate emails
DROP TRIGGER IF EXISTS prevent_duplicate_email ON profiles;
CREATE TRIGGER prevent_duplicate_email
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_existing_user();

-- Step 4: Update the create_profile function to handle duplicates gracefully
CREATE OR REPLACE FUNCTION create_profile(
    p_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_bio TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'student'
)
RETURNS VOID AS $$
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_id) THEN
        -- Update existing profile
        UPDATE profiles SET
            name = p_name,
            email = p_email,
            bio = p_bio,
            role = COALESCE(p_role, profiles.role),
            updated_at = NOW()
        WHERE id = p_id;
    ELSE
        -- Check if email is already used by another user
        IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email AND id != p_id) THEN
            RAISE EXCEPTION 'A user with this email already exists';
        END IF;
        
        -- Insert new profile
        INSERT INTO profiles (id, name, email, bio, role)
        VALUES (p_id, p_name, p_email, p_bio, p_role);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Step 6: Add comment
COMMENT ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) IS 'Creates or updates a user profile with duplicate email prevention';

-- Step 7: Verify the setup
SELECT 
    '✅ Unique constraint on profiles.email' as check_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'profiles' 
              AND constraint_type = 'UNIQUE'
              AND constraint_name LIKE '%email%'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status_1;

SELECT 
    '✅ Trigger prevent_duplicate_email' as check_2,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'prevent_duplicate_email'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status_2;

SELECT 
    '✅ Function create_profile updated' as check_3,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_profile'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status_3;
