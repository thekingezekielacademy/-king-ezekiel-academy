-- Fix the missing phone column issue
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Add the missing phone column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Step 2: Update the create_profile function to handle the phone parameter
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

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Step 4: Verify the fix
SELECT 
  'Phone column added successfully!' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'phone';

-- Step 5: Test the function
SELECT create_profile(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Test Admin',
  'admin@kingezekielacademy.com',
  NULL, -- phone
  'admin'
);

-- Step 6: Clean up test data
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Step 7: Final verification
SELECT 'Fix completed successfully! Signup should now work.' as message;
