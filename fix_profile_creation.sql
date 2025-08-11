-- Fix Profile Creation Issue
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Drop the existing create_profile function if it exists
DROP FUNCTION IF EXISTS create_profile(UUID, TEXT, TEXT, TEXT, TEXT);

-- Step 2: Create a trigger function that automatically creates profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NULL, -- phone
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger on the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Step 5: Test the trigger by checking if it exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 6: Verify the profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 7: Final message
SELECT 'Profile creation trigger created successfully! Signup should now work automatically.' as message;
