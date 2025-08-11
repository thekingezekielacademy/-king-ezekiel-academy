-- CLEAN FUNCTION FIX - Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Drop ALL versions of the create_profile function
DROP FUNCTION IF EXISTS create_profile(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_profile(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_profile(UUID, TEXT, TEXT);

-- Step 2: Create the NEW create_profile function with correct signature
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Step 4: Verify the function exists with correct signature
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_profile' 
  AND routine_schema = 'public';

-- Step 5: Test message
SELECT 'Function cleaned and recreated successfully!' as message;
