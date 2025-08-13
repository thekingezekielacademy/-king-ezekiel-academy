-- Update blog_posts table schema to match user requirements
-- Drop old columns and add new ones

-- First, drop the old columns that are no longer needed
ALTER TABLE blog_posts DROP COLUMN IF EXISTS slug;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_keywords;

-- Add new columns that match user requirements
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS header TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS conclusion TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image TEXT;

-- Add additional relevant fields
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS viewers INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 1; -- in minutes
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Update existing rows to have default values for new required fields
UPDATE blog_posts SET 
  header = COALESCE(excerpt, ''),
  body = COALESCE(content, ''),
  conclusion = '',
  image = COALESCE(featured_image_url, '')
WHERE header IS NULL OR body IS NULL;

-- Make the new required fields NOT NULL after setting defaults
ALTER TABLE blog_posts ALTER COLUMN header SET NOT NULL;
ALTER TABLE blog_posts ALTER COLUMN body SET NOT NULL;

-- Drop the old content and featured_image_url columns
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS featured_image_url;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_blog_posts_header ON blog_posts(header);
CREATE INDEX IF NOT EXISTS idx_blog_posts_viewers ON blog_posts(viewers);
CREATE INDEX IF NOT EXISTS idx_blog_posts_likes ON blog_posts(likes);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_reading_time ON blog_posts(reading_time);

-- Update RLS policies to work with new schema
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Add policy for viewing blog post details (for view counting)
CREATE POLICY "Public can view blog post details" ON blog_posts
  FOR SELECT USING (true);

-- Add policy for updating view counts
CREATE POLICY "Public can update view counts" ON blog_posts
  FOR UPDATE USING (true) WITH CHECK (true);
