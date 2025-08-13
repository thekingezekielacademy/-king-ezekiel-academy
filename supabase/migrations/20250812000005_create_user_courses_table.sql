-- Create user_courses table for tracking user progress and enrollments
-- Run this in your Supabase SQL Editor

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

-- Insert comment
COMMENT ON TABLE user_courses IS 'Tracks user enrollments and progress in courses';
COMMENT ON COLUMN user_courses.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN user_courses.completed_lessons IS 'Array of completed lesson IDs';
COMMENT ON COLUMN user_courses.last_accessed IS 'Last time user accessed this course';
COMMENT ON COLUMN user_courses.is_completed IS 'Whether the course is fully completed';
-- Run this in your Supabase SQL Editor

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

-- Insert comment
COMMENT ON TABLE user_courses IS 'Tracks user enrollments and progress in courses';
COMMENT ON COLUMN user_courses.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN user_courses.completed_lessons IS 'Array of completed lesson IDs';
COMMENT ON COLUMN user_courses.last_accessed IS 'Last time user accessed this course';
COMMENT ON COLUMN user_courses.is_completed IS 'Whether the course is fully completed';
