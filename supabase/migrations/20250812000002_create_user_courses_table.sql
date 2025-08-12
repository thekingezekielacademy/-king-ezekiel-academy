-- Create user_courses table for tracking user enrollment and progress
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_last_accessed ON user_courses(last_accessed);

-- Enable Row Level Security
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own course enrollments" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course enrollments" ON user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course enrollments" ON user_courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course enrollments" ON user_courses
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_courses IS 'Tracks user enrollment and progress in courses';
COMMENT ON COLUMN user_courses.progress IS 'Course completion percentage (0-100)';
COMMENT ON COLUMN user_courses.completed_lessons IS 'Number of lessons completed in the course';
COMMENT ON COLUMN user_courses.last_accessed IS 'Last time user accessed this course';
COMMENT ON COLUMN user_courses.enrolled_at IS 'When user enrolled in the course';
