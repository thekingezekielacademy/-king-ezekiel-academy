-- Add XP and Streak system to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT CURRENT_DATE;

-- Create function to update XP and streak
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_xp_and_streak(UUID, INTEGER, TEXT) TO authenticated;

-- Create RLS policy for the function
CREATE POLICY "Users can update their own XP and streak" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Add comments for documentation
COMMENT ON COLUMN profiles.xp IS 'Total experience points earned by the user';
COMMENT ON COLUMN profiles.streak_count IS 'Current daily learning streak count';
COMMENT ON COLUMN profiles.last_activity_date IS 'Last date user performed a learning activity';
COMMENT ON FUNCTION update_user_xp_and_streak(UUID, INTEGER, TEXT) IS 'Updates user XP and streak based on learning activity';
