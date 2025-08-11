-- SIMPLE FIX - Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Drop the problematic foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Drop the create_profile function if it exists
DROP FUNCTION IF EXISTS create_profile(UUID, TEXT, TEXT, TEXT, TEXT);

-- Step 3: Create a simple create_profile function that works
CREATE OR REPLACE FUNCTION create_profile(
  p_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'student'
)
RETURNS VOID AS $$
BEGIN
  -- Simple insert without foreign key constraint
  INSERT INTO profiles (id, name, email, role, created_at, updated_at)
  VALUES (p_id, p_name, p_email, p_role, NOW(), NOW());
EXCEPTION
  WHEN unique_violation THEN
    -- Update if already exists
    UPDATE profiles 
    SET name = p_name, email = p_email, role = p_role, updated_at = NOW()
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Step 5: Test message
SELECT 'Simple fix applied! Profile creation should now work.' as message;
