-- Fix SignUp Issues and Security - Run this in Supabase Dashboard > SQL Editor
-- This script fixes the missing phone column and applies proper RLS policies

-- Step 1: Add missing phone column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Step 2: Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Public can view lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Public can view course covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload course covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course covers" ON storage.objects;

-- Step 3: Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 5: Create RLS policies for courses table
CREATE POLICY "Public can view published courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 6: Create RLS policies for lessons table
CREATE POLICY "Public can view published lessons" ON lessons
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 7: Create storage policies
CREATE POLICY "Public can view course covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-covers');

CREATE POLICY "Authenticated users can upload course covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can delete course covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-covers'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 8: Update the create_profile function
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

-- Step 9: Grant execute permissions
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Step 10: Verify the setup
SELECT 
  'Profiles table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 11: Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'courses', 'lessons');

-- Step 12: Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public';
