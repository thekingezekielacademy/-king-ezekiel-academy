-- Clean setup for courses and storage
-- This migration sets up everything needed for the course system

-- Ensure courses table has all required columns
DO $$ 
BEGIN
    -- Add level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'level') THEN
        ALTER TABLE courses ADD COLUMN level TEXT NOT NULL DEFAULT 'beginner';
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'created_by') THEN
        ALTER TABLE courses ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add cover_photo_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'cover_photo_url') THEN
        ALTER TABLE courses ADD COLUMN cover_photo_url TEXT;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'updated_at') THEN
        ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add level constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'courses_level_check') THEN
        ALTER TABLE courses ADD CONSTRAINT courses_level_check CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert', 'mastery'));
    END IF;
END $$;

-- Create course_videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  link TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_course_videos_course_id ON course_videos(course_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_order ON course_videos(course_id, order_index);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;

-- Create RLS Policies for courses
CREATE POLICY "Users can view all courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create courses" ON courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own courses" ON courses
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own courses" ON courses
  FOR DELETE USING (auth.uid() = created_by);

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all course videos" ON course_videos;
DROP POLICY IF EXISTS "Authenticated users can create course videos" ON course_videos;
DROP POLICY IF EXISTS "Users can update videos in their courses" ON course_videos;
DROP POLICY IF EXISTS "Users can delete videos in their courses" ON course_videos;

-- Create RLS Policies for course_videos
CREATE POLICY "Users can view all course videos" ON course_videos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create course videos" ON course_videos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update videos in their courses" ON course_videos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_videos.course_id 
      AND courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete videos in their courses" ON course_videos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_videos.course_id 
      AND courses.created_by = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_course_videos_updated_at ON course_videos;

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_videos_updated_at 
  BEFORE UPDATE ON course_videos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for course cover photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-covers', 'course-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload course covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view course covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow course creators to update cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow course creators to delete cover photos" ON storage.objects;

-- Create storage policy for course covers
-- Allow authenticated users to upload cover photos
CREATE POLICY "Allow authenticated users to upload course covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-covers' 
    AND auth.role() = 'authenticated'
  );

-- Allow public to view course covers
CREATE POLICY "Allow public to view course covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-covers');

-- Allow course creators to update their own cover photos
CREATE POLICY "Allow course creators to update cover photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-covers' 
    AND auth.uid() IN (
      SELECT created_by FROM courses 
      WHERE cover_photo_url LIKE '%' || name || '%'
    )
  );

-- Allow course creators to delete their own cover photos
CREATE POLICY "Allow course creators to delete cover photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-covers' 
    AND auth.uid() IN (
      SELECT created_by FROM courses 
      WHERE cover_photo_url LIKE '%' || name || '%'
    )
  );
