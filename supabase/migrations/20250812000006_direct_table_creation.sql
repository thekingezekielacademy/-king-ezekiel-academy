-- Direct Table Creation - No Conflicts
-- This migration ONLY creates new tables without touching existing ones

-- 1. Add XP columns to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'xp') THEN
    ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'streak_count') THEN
    ALTER TABLE profiles ADD COLUMN streak_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity_date') THEN
    ALTER TABLE profiles ADD COLUMN last_activity_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- 2. Create user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_lessons INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 3. Create user_lesson_progress table
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(user_id, course_id, lesson_id)
);

-- 4. Create subscriptions table for Paystack integration
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_subscription_id TEXT UNIQUE NOT NULL,
  paystack_customer_code TEXT,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  amount INTEGER NOT NULL, -- Amount in kobo (smallest currency unit)
  currency TEXT DEFAULT 'NGN',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create subscription_payments table for billing history
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  paystack_transaction_id TEXT UNIQUE NOT NULL,
  paystack_reference TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in kobo
  currency TEXT DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'abandoned')),
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);

-- 7. Enable RLS
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- 8. Create basic RLS policies
CREATE POLICY "Users can manage their own course data" ON user_courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own lesson progress" ON user_lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own payment history" ON subscription_payments FOR SELECT USING (auth.uid() = user_id);

-- 9. Create XP function
CREATE OR REPLACE FUNCTION update_user_xp_and_streak(
  user_id UUID,
  xp_to_add INTEGER,
  activity_type TEXT DEFAULT 'general'
)
RETURNS JSON AS $$
DECLARE
  current_streak INTEGER;
  current_xp INTEGER;
  last_activity DATE;
  streak_bonus INTEGER;
  total_xp_gained INTEGER;
  new_streak INTEGER;
BEGIN
  SELECT xp, streak_count, last_activity_date 
  INTO current_xp, current_streak, last_activity
  FROM profiles 
  WHERE id = user_id;
  
  streak_bonus := current_streak * 10;
  
  IF last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    new_streak := current_streak + 1;
  ELSIF last_activity = CURRENT_DATE THEN
    new_streak := current_streak;
  ELSE
    new_streak := 1;
  END IF;
  
  total_xp_gained := xp_to_add + streak_bonus;
  
  UPDATE profiles 
  SET 
    xp = current_xp + total_xp_gained,
    streak_count = new_streak,
    last_activity_date = CURRENT_DATE
  WHERE id = user_id;
  
  RETURN json_build_object(
    'xp_gained', total_xp_gained,
    'base_xp', xp_to_add,
    'streak_bonus', streak_bonus,
    'new_streak', new_streak,
    'new_total_xp', current_xp + total_xp_gained,
    'activity_type', activity_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_xp_and_streak(UUID, INTEGER, TEXT) TO authenticated;
