-- Final XP and Progress System Setup
-- This migration ONLY adds missing features without touching existing ones

-- 1. Add XP and streak columns to profiles table (if they don't exist)
DO $$ 
BEGIN
  -- Add xp column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'xp') THEN
    ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0;
    RAISE NOTICE 'Added xp column to profiles table';
  ELSE
    RAISE NOTICE 'xp column already exists in profiles table';
  END IF;
  
  -- Add streak_count column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'streak_count') THEN
    ALTER TABLE profiles ADD COLUMN streak_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added streak_count column to profiles table';
  ELSE
    RAISE NOTICE 'streak_count column already exists in profiles table';
  END IF;
  
  -- Add last_activity_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'last_activity_date') THEN
    ALTER TABLE profiles ADD COLUMN last_activity_date DATE DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Added last_activity_date column to profiles table';
  ELSE
    RAISE NOTICE 'last_activity_date column already exists in profiles table';
  END IF;
END $$;

-- 2. Create or replace the XP update function
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
  -- Get current user stats
  SELECT xp, streak_count, last_activity_date 
  INTO current_xp, current_streak, last_activity
  FROM profiles 
  WHERE id = user_id;
  
  -- Calculate streak bonus (10 × streak_count)
  streak_bonus := current_streak * 10;
  
  -- Check if streak should continue or reset
  IF last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Yesterday - continue streak
    new_streak := current_streak + 1;
  ELSIF last_activity = CURRENT_DATE THEN
    -- Already active today - maintain streak
    new_streak := current_streak;
  ELSE
    -- Older than yesterday - reset streak
    new_streak := 1;
  END IF;
  
  -- Calculate total XP gained
  total_xp_gained := xp_to_add + streak_bonus;
  
  -- Update user profile
  UPDATE profiles 
  SET 
    xp = current_xp + total_xp_gained,
    streak_count = new_streak,
    last_activity_date = CURRENT_DATE
  WHERE id = user_id;
  
  -- Return updated stats
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

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_xp_and_streak(UUID, INTEGER, TEXT) TO authenticated;

-- 4. Create user_courses table if it doesn't exist
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

-- 5. Create user_lesson_progress table if it doesn't exist
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

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_last_accessed ON user_courses(last_accessed);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_course_id ON user_lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(is_completed);

-- 7. Enable Row Level Security
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (only if they don't exist)
DO $$
BEGIN
  -- user_courses policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'Users can view their own course enrollments') THEN
    CREATE POLICY "Users can view their own course enrollments" ON user_courses
      FOR SELECT USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view their own course enrollments';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own course enrollments';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'Users can insert their own course enrollments') THEN
    CREATE POLICY "Users can insert their own course enrollments" ON user_courses
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can insert their own course enrollments';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can insert their own course enrollments';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'Users can update their own course enrollments') THEN
    CREATE POLICY "Users can update their own course enrollments" ON user_courses
      FOR UPDATE USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can update their own course enrollments';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can update their own course enrollments';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'Users can delete their own course enrollments') THEN
    CREATE POLICY "Users can delete their own course enrollments" ON user_courses
      FOR DELETE USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can delete their own course enrollments';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can delete their own course enrollments';
  END IF;
  
  -- user_lesson_progress policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can view their own lesson progress') THEN
    CREATE POLICY "Users can view their own lesson progress" ON user_lesson_progress
      FOR SELECT USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can view their own lesson progress';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can view their own lesson progress';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can insert their own lesson progress') THEN
    CREATE POLICY "Users can insert their own lesson progress" ON user_lesson_progress
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can insert their own lesson progress';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can insert their own lesson progress';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can update their own lesson progress') THEN
    CREATE POLICY "Users can update their own lesson progress" ON user_lesson_progress
      FOR UPDATE USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can update their own lesson progress';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can update their own lesson progress';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_lesson_progress' AND policyname = 'Users can delete their own lesson progress') THEN
    CREATE POLICY "Users can delete their own lesson progress" ON user_lesson_progress
      FOR DELETE USING (auth.uid() = user_id);
    RAISE NOTICE 'Created policy: Users can delete their own lesson progress';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can delete their own lesson progress';
  END IF;
END $$;

-- 9. Add comments for documentation
COMMENT ON COLUMN profiles.xp IS 'Total experience points earned by the user';
COMMENT ON COLUMN profiles.streak_count IS 'Current daily learning streak count';
COMMENT ON COLUMN profiles.last_activity_date IS 'Last date user performed a learning activity';
COMMENT ON FUNCTION update_user_xp_and_streak(UUID, INTEGER, TEXT) IS 'Updates user XP and streak based on learning activity';
COMMENT ON TABLE user_courses IS 'Tracks user enrollment and progress in courses';
COMMENT ON TABLE user_lesson_progress IS 'Tracks individual lesson completion and progress for users';

-- 10. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ XP and Progress System Setup Complete!';
  RAISE NOTICE '✅ Added XP columns to profiles table';
  RAISE NOTICE '✅ Created user_courses table for enrollment tracking';
  RAISE NOTICE '✅ Created user_lesson_progress table for lesson completion';
  RAISE NOTICE '✅ Created update_user_xp_and_streak function';
  RAISE NOTICE '✅ All RLS policies and indexes created';
  RAISE NOTICE '🎯 System is now ready for full XP and progress tracking!';
END $$;
