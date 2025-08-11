-- Fix function overloading conflict for create_profile
-- This resolves the "Could not choose the best candidate function" error

-- Drop all existing create_profile functions to resolve conflicts
DROP FUNCTION IF EXISTS create_profile(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_profile(UUID, TEXT, TEXT, TEXT);

-- Create a single, correct version of the create_profile function
CREATE OR REPLACE FUNCTION create_profile(
  p_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_bio TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'student'
)
RETURNS VOID AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO profiles (id, name, email, bio, role)
  VALUES (p_id, p_name, p_email, p_bio, p_role)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    bio = EXCLUDED.bio,
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) IS 'Creates or updates a user profile with bio support';
