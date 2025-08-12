-- Add missing columns to profiles table if they don't exist
-- Run this in your Supabase SQL Editor

-- Add subscription-related columns to profiles table
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
