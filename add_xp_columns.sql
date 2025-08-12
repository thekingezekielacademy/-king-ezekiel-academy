-- Add XP and streak tracking to profiles table
-- Run this in your Supabase SQL Editor

-- Add XP and streak columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON profiles(streak_count);

-- Create function to update XP and streak
CREATE OR REPLACE FUNCTION update_user_xp_and_streak(
  user_id UUID,
  xp_gain INTEGER DEFAULT 0,
  activity_type TEXT DEFAULT 'lesson_completed'
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    xp = xp + xp_gain,
    last_activity_date = NOW(),
    streak_count = CASE 
      WHEN last_activity_date::date = NOW()::date THEN streak_count
      WHEN last_activity_date::date = (NOW() - INTERVAL '1 day')::date THEN streak_count + 1
      ELSE 1
    END
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_xp_and_streak(UUID, INTEGER, TEXT) TO authenticated;

-- Test the function (optional)
-- SELECT update_user_xp_and_streak('your-user-id-here', 50, 'lesson_completed');
