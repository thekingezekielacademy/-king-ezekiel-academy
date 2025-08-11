# Supabase Setup Guide for King Ezekiel Academy

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `king-ezekiel-academy`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be set up (2-3 minutes)

### 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to **Settings** > **API**
3. Copy your **Project URL** and **anon public key**
4. Create a `.env` file in the `client` directory with:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Create Database Tables

Run these SQL commands in your Supabase SQL editor:

#### Profiles Table
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

Attempting signup with: Object
evqerkqiquwxqlizdqmg.supabase.co/rest/v1/rpc/create_profile:1  Failed to load resource: the server responded with a status of 400 ()Understand this error
AuthContext.tsx:118 Error creating profile: Object
signUp @ AuthContext.tsx:118Understand this error
SignUp.tsx:68 Signup result: Object
SignUp.tsx:74 Signup successful, user created: Object#### Courses Table
```sql
-- Create courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  level TEXT DEFAULT 'beginner',
  duration TEXT,
  instructor TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  students_count INTEGER DEFAULT 0,
  image_url TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Instructors can manage their courses" ON courses
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'instructor'
  ));
```

#### Enrollments Table
```sql
-- Create enrollments table
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Automatic Profile Creation Trigger (Recommended)

Run this to ensure a profile row is created automatically whenever a new auth user is created.

```sql
-- Create or replace function to handle new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Notes:
- Ensure `profiles` table has columns: `id UUID PK`, `name TEXT`, `email TEXT`, `phone TEXT NULL`, `role TEXT DEFAULT 'student'`, `created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ`.
- RLS policies must allow inserts via trigger (runs as SECURITY DEFINER).
- The profile will be present after email confirmation if you require confirmation.

### 4. Configure Authentication Settings

1. Go to **Authentication** > **Settings** in your Supabase dashboard
2. Configure your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. Go to **Authentication** > **Providers**
4. Enable/configure providers as needed:
   - **Email**: Enabled by default
   - **Google**: Optional (requires Google OAuth setup)
   - **Facebook**: Optional (requires Facebook OAuth setup)

### 5. Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the email templates for:
   - **Confirm signup**
   - **Reset password**
   - **Magic link**

## 🎯 Features Implemented

### ✅ User Registration
- Email/password signup
- Form validation
- Password confirmation
- Terms & conditions acceptance
- Role selection (student, parent, teacher, administrator)
- Automatic profile creation

### ✅ User Authentication
- Email/password login
- Session management
- Automatic redirect after login
- Logout functionality

### ✅ User Profile Management
- Profile creation on signup
- User data storage
- Role-based access control

### ✅ Security Features
- Row Level Security (RLS)
- Password hashing (handled by Supabase)
- Email verification
- Session management

### ✅ UI/UX Features
- Loading states
- Error handling
- Success messages
- Form validation
- Password visibility toggle
- Responsive design

## 🚀 Testing the Implementation

1. Start your React app:
   ```bash
   cd client
   npm start
   ```

2. Navigate to the signup page: `http://localhost:3000/signup`

3. Test the signup flow:
   - Fill out the form
   - Submit the form
   - Check your email for verification
   - Try logging in

4. Check your Supabase dashboard:
   - Go to **Authentication** > **Users** to see new users
   - Go to **Table Editor** > **profiles** to see user profiles

## 🔧 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Make sure `.env` file is in the `client` directory
   - Restart your development server after adding `.env`
   - Check that variable names start with `REACT_APP_`

2. **Supabase Connection Errors**
   - Verify your project URL and anon key are correct
   - Check that your Supabase project is active
   - Ensure your project hasn't been paused

3. **Database Errors**
   - Run the SQL commands in the correct order
   - Check that RLS policies are created correctly
   - Verify table structure matches the schema

4. **Authentication Issues**
   - Check your site URL configuration
   - Verify redirect URLs are set correctly
   - Ensure email templates are configured

### Debug Steps

1. Check browser console for errors
2. Verify Supabase client initialization
3. Test database connection
4. Check authentication state
5. Verify email delivery

## 📝 Next Steps

1. **Add Password Reset Functionality**
   - Implement forgot password flow
   - Create password reset page

2. **Enhance User Profiles**
   - Add profile editing
   - Upload avatar images
   - Add bio and preferences

3. **Implement Course System**
   - Course enrollment
   - Progress tracking
   - Course completion certificates

4. **Add Admin Dashboard**
   - User management
   - Course management
   - Analytics and reporting

5. **Social Authentication**
   - Google OAuth
   - Facebook OAuth
   - GitHub OAuth

6. **Email Notifications**
   - Welcome emails
   - Course updates
   - Achievement notifications

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Authentication Best Practices](https://supabase.com/docs/guides/auth/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Troubleshooting Profile Creation

If profiles are not being created, check the RLS policies:

### Check Current RLS Policies
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Fix RLS Policies (if needed)
```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert profiles (for signup)
CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Test Profile Creation
```sql
-- Check if you can insert a test profile
INSERT INTO profiles (id, name, email, role, created_at)
VALUES (
  'test-user-id',
  'Test User',
  'test@example.com',
  'student',
  NOW()
);

-- If this fails, there's an RLS issue
-- If it succeeds, the issue is in the application code
```
