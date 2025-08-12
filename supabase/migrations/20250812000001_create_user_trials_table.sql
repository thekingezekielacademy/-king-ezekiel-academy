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

-- Insert comment
COMMENT ON TABLE user_trials IS 'Tracks 7-day free trials for new users';
COMMENT ON COLUMN user_trials.start_date IS 'When the trial started';
COMMENT ON COLUMN user_trials.end_date IS 'When the trial expires';
COMMENT ON COLUMN user_trials.is_active IS 'Whether the trial is currently active';
COMMENT ON COLUMN user_trials.ended_at IS 'When the trial was ended (if manually ended)';
