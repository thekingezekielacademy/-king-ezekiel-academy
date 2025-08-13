-- Fix RLS policies for blog posts to allow public access
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Public can view blog post details" ON blog_posts;
DROP POLICY IF EXISTS "Public can update view counts" ON blog_posts;

-- Create new policies that allow public access to published posts
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Allow public to view all blog post details (for view counting, etc.)
CREATE POLICY "Public can view all blog posts" ON blog_posts
  FOR SELECT USING (true);

-- Allow authenticated users to update view counts
CREATE POLICY "Authenticated users can update view counts" ON blog_posts
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (true);

-- Keep existing admin policies
-- The existing policies for authors and admins should remain unchanged
