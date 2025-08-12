-- Award retroactive XP for already completed course
-- Run this in your Supabase SQL Editor after the previous XP system setup

-- First, let's see your current user ID and profile
SELECT id, email, xp, streak_count, last_activity_date 
FROM profiles 
WHERE email = 'your-email@example.com'; -- Replace with your actual email

-- Award XP for completed lessons (2 lessons × 50 XP = 100 XP)
-- Award XP for completed course (+200 XP bonus = 300 XP total)
UPDATE profiles 
SET 
  xp = 300, -- 100 XP from lessons + 200 XP bonus from course completion
  last_activity_date = NOW(),
  streak_count = 1 -- Start with 1 day streak
WHERE email = 'your-email@example.com'; -- Replace with your actual email

-- Verify the update
SELECT id, email, xp, streak_count, last_activity_date 
FROM profiles 
WHERE email = 'your-email@example.com'; -- Replace with your actual email

-- Alternative: Award XP by user ID (if you know your user ID)
-- UPDATE profiles 
-- SET 
--   xp = 300,
--   last_activity_date = NOW(),
--   streak_count = 1
-- WHERE id = 'your-user-id-here'; -- Replace with your actual user ID
