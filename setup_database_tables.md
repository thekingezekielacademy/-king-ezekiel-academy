# 🗄️ Database Setup Guide

## 🔧 **FIX THE 404/406 ERRORS**

The console logs show that several database tables are missing, causing 404 and 406 errors. Follow this guide to create all necessary tables.

## 📋 **Required Tables to Create:**

1. **user_subscriptions** - For subscription management
2. **subscription_payments** - For payment tracking  
3. **user_trials** - For 7-day free trial system
4. **user_courses** - For course progress tracking

## 🚀 **Step-by-Step Setup:**

### **Step 1: Open Supabase SQL Editor**
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### **Step 2: Run Migration 1 - User Trials**
Copy and paste this into the SQL Editor:

```sql
-- Create user_trials table for 7-day free trial system
CREATE TABLE IF NOT EXISTS user_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one active trial per user
  UNIQUE(user_id, is_active) WHERE is_active = true
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_active ON user_trials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_trials_end_date ON user_trials(end_date);

-- Enable Row Level Security
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trial" ON user_trials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial" ON user_trials
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all trials
CREATE POLICY "Admins can view all trials" ON user_trials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admin can update all trials
CREATE POLICY "Admins can update all trials" ON user_trials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically end expired trials
CREATE OR REPLACE FUNCTION end_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE user_trials 
  SET 
    is_active = false,
    ended_at = NOW(),
    updated_at = NOW()
  WHERE 
    is_active = true 
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically end expired trials
CREATE OR REPLACE FUNCTION trigger_end_expired_trials()
RETURNS trigger AS $$
BEGIN
  -- Check if any trials have expired
  PERFORM end_expired_trials();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (runs on any table change to check for expired trials)
CREATE TRIGGER check_expired_trials
  AFTER INSERT OR UPDATE OR DELETE ON user_trials
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_end_expired_trials();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_trials TO authenticated;
GRANT USAGE ON SEQUENCE user_trials_id_seq TO authenticated;
```

Click **"Run"** to execute.

### **Step 3: Run Migration 2 - XP System**
Create a new query and run:

```sql
-- Add XP and streak tracking to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON profiles(streak_count);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_date);

-- Function to update user XP and streak
CREATE OR REPLACE FUNCTION update_user_xp_and_streak(
  p_user_id UUID,
  p_xp_to_add INTEGER DEFAULT 0
)
RETURNS void AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  last_activity DATE;
  current_streak INTEGER;
BEGIN
  -- Get current streak and last activity
  SELECT streak_count, last_activity_date INTO current_streak, last_activity
  FROM profiles WHERE id = p_user_id;
  
  -- Update XP
  UPDATE profiles 
  SET xp = xp + p_xp_to_add
  WHERE id = p_user_id;
  
  -- Update streak logic
  IF last_activity IS NULL OR last_activity < current_date THEN
    -- First activity or new day
    IF last_activity IS NULL OR last_activity = current_date - INTERVAL '1 day' THEN
      -- Consecutive day
      UPDATE profiles 
      SET 
        streak_count = COALESCE(current_streak, 0) + 1,
        last_activity_date = current_date
      WHERE id = p_user_id;
    ELSE
      -- Break in streak, reset to 1
      UPDATE profiles 
      SET 
        streak_count = 1,
        last_activity_date = current_date
      WHERE id = p_user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_xp_and_streak TO authenticated;
```

### **Step 4: Run Migration 3 - Subscription Tables**
Create a new query and run:

```sql
-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_subscription_id TEXT,
  paystack_customer_code TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Monthly Membership',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  amount INTEGER NOT NULL, -- Amount in kobo (smallest currency unit)
  currency TEXT NOT NULL DEFAULT 'NGN',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_transaction_id TEXT,
  paystack_reference TEXT,
  amount INTEGER NOT NULL, -- Amount in kobo
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  payment_method TEXT DEFAULT 'card',
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paystack_id ON user_subscriptions(paystack_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paystack_ref ON subscription_payments(paystack_reference);

-- Enable Row Level Security (RLS)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for subscription_payments
CREATE POLICY "Users can view their own payments" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON subscription_payments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

### **Step 5: Run Migration 4 - User Courses Table**
Create a new query and run:

```sql
-- Create user_courses table for tracking user progress and enrollments
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), -- Progress percentage
  completed_lessons JSONB DEFAULT '[]', -- Array of completed lesson IDs
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  
  -- Ensure one enrollment per user per course
  UNIQUE(user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_progress ON user_courses(progress);
CREATE INDEX IF NOT EXISTS idx_user_courses_last_accessed ON user_courses(last_accessed);
CREATE INDEX IF NOT EXISTS idx_user_courses_completed ON user_courses(is_completed);

-- Enable Row Level Security
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own course enrollments" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course enrollments" ON user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course enrollments" ON user_courses
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all enrollments
CREATE POLICY "Admins can view all course enrollments" ON user_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admin can update all enrollments
CREATE POLICY "Admins can update all course enrollments" ON user_courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to update progress when lessons are completed
CREATE OR REPLACE FUNCTION update_course_progress(
  p_user_id UUID,
  p_course_id UUID,
  p_lesson_id UUID,
  p_total_lessons INTEGER
)
RETURNS void AS $$
DECLARE
  current_completed_lessons JSONB;
  new_completed_lessons JSONB;
  new_progress INTEGER;
BEGIN
  -- Get current completed lessons
  SELECT completed_lessons INTO current_completed_lessons
  FROM user_courses
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Add new lesson to completed list if not already there
  IF current_completed_lessons IS NULL THEN
    current_completed_lessons := '[]'::JSONB;
  END IF;
  
  IF NOT (current_completed_lessons @> jsonb_build_array(p_lesson_id::text)) THEN
    new_completed_lessons := current_completed_lessons || jsonb_build_array(p_lesson_id::text);
    
    -- Calculate new progress
    new_progress := (jsonb_array_length(new_completed_lessons) * 100) / p_total_lessons;
    
    -- Update the record
    UPDATE user_courses
    SET 
      progress = new_progress,
      completed_lessons = new_completed_lessons,
      last_accessed = NOW(),
      is_completed = (new_progress >= 100),
      completed_at = CASE WHEN new_progress >= 100 AND completed_at IS NULL THEN NOW() ELSE completed_at END
    WHERE user_id = p_user_id AND course_id = p_course_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON user_courses TO authenticated;
GRANT EXECUTE ON FUNCTION update_course_progress TO authenticated;
```

### **Step 6: Add Missing Profile Columns**
Create a new query and run:

```sql
-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  END IF;
  
  -- Add subscription_plan column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'none';
  END IF;
  
  -- Add subscription_expires_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for subscription status
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Update existing profiles to have default subscription status
UPDATE profiles 
SET subscription_status = 'inactive' 
WHERE subscription_status IS NULL;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
```

## ✅ **Verification Steps:**

After running all migrations, test by:

1. **Refresh your app**
2. **Check console logs** - should see no more 404/406 errors
3. **Sign in with a user** - should work without database errors
4. **Check subscription status** - should work properly

## 🎯 **Expected Results:**

- ✅ No more 404 errors for `user_subscriptions`
- ✅ No more 404 errors for `user_trials` 
- ✅ No more 404 errors for `user_courses`
- ✅ Subscription system works properly
- ✅ Trial system works properly
- ✅ Course progress tracking works

## 🚨 **If You Still See Errors:**

1. **Check Supabase logs** for any SQL errors
2. **Verify RLS policies** are working correctly
3. **Test with a fresh user** to see if the issue persists

---

**Run these migrations in order and the 404/406 errors should be completely resolved!** 🎉

## 🔧 **FIX THE 404/406 ERRORS**

The console logs show that several database tables are missing, causing 404 and 406 errors. Follow this guide to create all necessary tables.

## 📋 **Required Tables to Create:**

1. **user_subscriptions** - For subscription management
2. **subscription_payments** - For payment tracking  
3. **user_trials** - For 7-day free trial system
4. **user_courses** - For course progress tracking

## 🚀 **Step-by-Step Setup:**

### **Step 1: Open Supabase SQL Editor**
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### **Step 2: Run Migration 1 - User Trials**
Copy and paste this into the SQL Editor:

```sql
-- Create user_trials table for 7-day free trial system
CREATE TABLE IF NOT EXISTS user_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one active trial per user
  UNIQUE(user_id, is_active) WHERE is_active = true
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_active ON user_trials(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_trials_end_date ON user_trials(end_date);

-- Enable Row Level Security
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trial" ON user_trials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial" ON user_trials
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all trials
CREATE POLICY "Admins can view all trials" ON user_trials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admin can update all trials
CREATE POLICY "Admins can update all trials" ON user_trials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically end expired trials
CREATE OR REPLACE FUNCTION end_expired_trials()
RETURNS void AS $$
BEGIN
  UPDATE user_trials 
  SET 
    is_active = false,
    ended_at = NOW(),
    updated_at = NOW()
  WHERE 
    is_active = true 
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically end expired trials
CREATE OR REPLACE FUNCTION trigger_end_expired_trials()
RETURNS trigger AS $$
BEGIN
  -- Check if any trials have expired
  PERFORM end_expired_trials();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (runs on any table change to check for expired trials)
CREATE TRIGGER check_expired_trials
  AFTER INSERT OR UPDATE OR DELETE ON user_trials
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_end_expired_trials();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_trials TO authenticated;
GRANT USAGE ON SEQUENCE user_trials_id_seq TO authenticated;
```

Click **"Run"** to execute.

### **Step 3: Run Migration 2 - XP System**
Create a new query and run:

```sql
-- Add XP and streak tracking to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON profiles(streak_count);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity_date);

-- Function to update user XP and streak
CREATE OR REPLACE FUNCTION update_user_xp_and_streak(
  p_user_id UUID,
  p_xp_to_add INTEGER DEFAULT 0
)
RETURNS void AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  last_activity DATE;
  current_streak INTEGER;
BEGIN
  -- Get current streak and last activity
  SELECT streak_count, last_activity_date INTO current_streak, last_activity
  FROM profiles WHERE id = p_user_id;
  
  -- Update XP
  UPDATE profiles 
  SET xp = xp + p_xp_to_add
  WHERE id = p_user_id;
  
  -- Update streak logic
  IF last_activity IS NULL OR last_activity < current_date THEN
    -- First activity or new day
    IF last_activity IS NULL OR last_activity = current_date - INTERVAL '1 day' THEN
      -- Consecutive day
      UPDATE profiles 
      SET 
        streak_count = COALESCE(current_streak, 0) + 1,
        last_activity_date = current_date
      WHERE id = p_user_id;
    ELSE
      -- Break in streak, reset to 1
      UPDATE profiles 
      SET 
        streak_count = 1,
        last_activity_date = current_date
      WHERE id = p_user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_xp_and_streak TO authenticated;
```

### **Step 4: Run Migration 3 - Subscription Tables**
Create a new query and run:

```sql
-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_subscription_id TEXT,
  paystack_customer_code TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Monthly Membership',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  amount INTEGER NOT NULL, -- Amount in kobo (smallest currency unit)
  currency TEXT NOT NULL DEFAULT 'NGN',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_transaction_id TEXT,
  paystack_reference TEXT,
  amount INTEGER NOT NULL, -- Amount in kobo
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  payment_method TEXT DEFAULT 'card',
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paystack_id ON user_subscriptions(paystack_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_paystack_ref ON subscription_payments(paystack_reference);

-- Enable Row Level Security (RLS)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for subscription_payments
CREATE POLICY "Users can view their own payments" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON subscription_payments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

### **Step 5: Run Migration 4 - User Courses Table**
Create a new query and run:

```sql
-- Create user_courses table for tracking user progress and enrollments
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), -- Progress percentage
  completed_lessons JSONB DEFAULT '[]', -- Array of completed lesson IDs
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  
  -- Ensure one enrollment per user per course
  UNIQUE(user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_progress ON user_courses(progress);
CREATE INDEX IF NOT EXISTS idx_user_courses_last_accessed ON user_courses(last_accessed);
CREATE INDEX IF NOT EXISTS idx_user_courses_completed ON user_courses(is_completed);

-- Enable Row Level Security
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own course enrollments" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course enrollments" ON user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course enrollments" ON user_courses
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all enrollments
CREATE POLICY "Admins can view all course enrollments" ON user_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admin can update all enrollments
CREATE POLICY "Admins can update all course enrollments" ON user_courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to update progress when lessons are completed
CREATE OR REPLACE FUNCTION update_course_progress(
  p_user_id UUID,
  p_course_id UUID,
  p_lesson_id UUID,
  p_total_lessons INTEGER
)
RETURNS void AS $$
DECLARE
  current_completed_lessons JSONB;
  new_completed_lessons JSONB;
  new_progress INTEGER;
BEGIN
  -- Get current completed lessons
  SELECT completed_lessons INTO current_completed_lessons
  FROM user_courses
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Add new lesson to completed list if not already there
  IF current_completed_lessons IS NULL THEN
    current_completed_lessons := '[]'::JSONB;
  END IF;
  
  IF NOT (current_completed_lessons @> jsonb_build_array(p_lesson_id::text)) THEN
    new_completed_lessons := current_completed_lessons || jsonb_build_array(p_lesson_id::text);
    
    -- Calculate new progress
    new_progress := (jsonb_array_length(new_completed_lessons) * 100) / p_total_lessons;
    
    -- Update the record
    UPDATE user_courses
    SET 
      progress = new_progress,
      completed_lessons = new_completed_lessons,
      last_accessed = NOW(),
      is_completed = (new_progress >= 100),
      completed_at = CASE WHEN new_progress >= 100 AND completed_at IS NULL THEN NOW() ELSE completed_at END
    WHERE user_id = p_user_id AND course_id = p_course_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON user_courses TO authenticated;
GRANT EXECUTE ON FUNCTION update_course_progress TO authenticated;
```

### **Step 6: Add Missing Profile Columns**
Create a new query and run:

```sql
-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  END IF;
  
  -- Add subscription_plan column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'none';
  END IF;
  
  -- Add subscription_expires_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index for subscription status
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Update existing profiles to have default subscription status
UPDATE profiles 
SET subscription_status = 'inactive' 
WHERE subscription_status IS NULL;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
```

## ✅ **Verification Steps:**

After running all migrations, test by:

1. **Refresh your app**
2. **Check console logs** - should see no more 404/406 errors
3. **Sign in with a user** - should work without database errors
4. **Check subscription status** - should work properly

## 🎯 **Expected Results:**

- ✅ No more 404 errors for `user_subscriptions`
- ✅ No more 404 errors for `user_trials` 
- ✅ No more 404 errors for `user_courses`
- ✅ Subscription system works properly
- ✅ Trial system works properly
- ✅ Course progress tracking works

## 🚨 **If You Still See Errors:**

1. **Check Supabase logs** for any SQL errors
2. **Verify RLS policies** are working correctly
3. **Test with a fresh user** to see if the issue persists

---

**Run these migrations in order and the 404/406 errors should be completely resolved!** 🎉
