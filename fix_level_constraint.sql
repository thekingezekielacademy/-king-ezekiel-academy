-- Fix the level constraint issue in courses table
-- This script ensures the constraint matches the values we're sending from the frontend

-- First, drop the existing constraint if it exists
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;

-- Add the correct constraint that matches our frontend values
ALTER TABLE courses ADD CONSTRAINT courses_level_check 
CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert', 'mastery'));

-- Update any existing courses with invalid level values to 'beginner'
UPDATE courses SET level = 'beginner' WHERE level NOT IN ('beginner', 'intermediate', 'advanced', 'expert', 'mastery');

-- Verify the constraint is working
SELECT level, COUNT(*) FROM courses GROUP BY level;
