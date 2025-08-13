-- Temporarily disable RLS on blog_posts to allow public access
-- This is for testing purposes - we'll re-enable it with proper policies later

-- Disable RLS temporarily
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Note: This allows full public access to the blog_posts table
-- We'll re-enable RLS with proper policies once the blog functionality is working
