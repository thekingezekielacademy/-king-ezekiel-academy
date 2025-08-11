-- Create function to create user profile (called by React app during signup)
CREATE OR REPLACE FUNCTION create_profile(
  p_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'student'
)
RETURNS VOID AS $$
BEGIN
  -- Insert profile if it doesn't exist
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
