-- Restore the create_profile function
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Create the create_profile function
CREATE OR REPLACE FUNCTION create_profile(
  p_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'student'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, role)
  VALUES (p_id, p_name, p_email, p_phone, p_role)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant execute permissions
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Step 3: Test the function
SELECT 'create_profile function restored successfully!' as message;

-- Step 4: Verify the function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_profile' 
  AND routine_schema = 'public';
