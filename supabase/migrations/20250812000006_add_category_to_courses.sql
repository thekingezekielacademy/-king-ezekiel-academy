-- Add category column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'business-entrepreneurship';

-- Add check constraint for valid categories (with proper error handling)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_category_check'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_category_check 
      CHECK (category IN (
        'business-entrepreneurship',
        'branding-public-relations',
        'content-communication',
        'digital-advertising',
        'email-seo-strategies',
        'ui-ux-design',
        'visual-communication',
        'video-editing-creation',
        'data-science-analytics',
        'artificial-intelligence-cloud',
        'project-workflow-management',
        'information-security'
      ));
  END IF;
END $$;

-- Create index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

-- Update existing courses to have a default category if they don't have one
UPDATE courses SET category = 'business-entrepreneurship' WHERE category IS NULL;
