-- Create user_lesson_progress table for tracking individual lesson completion
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0, -- Time spent in seconds
  notes TEXT, -- User notes about the lesson
  UNIQUE(user_id, course_id, lesson_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_course_id ON user_lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_completed ON user_lesson_progress(is_completed);

-- Enable Row Level Security
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own lesson progress" ON user_lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress" ON user_lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress" ON user_lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson progress" ON user_lesson_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE user_lesson_progress IS 'Tracks individual lesson completion and progress for users';
COMMENT ON COLUMN user_lesson_progress.is_completed IS 'Whether the lesson has been completed';
COMMENT ON COLUMN user_lesson_progress.completed_at IS 'When the lesson was completed';
COMMENT ON COLUMN user_lesson_progress.time_spent IS 'Time spent on the lesson in seconds';
COMMENT ON COLUMN user_lesson_progress.notes IS 'User notes or comments about the lesson';
