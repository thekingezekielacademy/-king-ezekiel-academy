-- Blog system migration
-- Creates 5 tables with proper relationships and SEO optimization

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMP,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blog categories
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Blog tags
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Many-to-many relationships
CREATE TABLE blog_post_categories (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE TABLE blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Create indexes for SEO and performance
CREATE INDEX idx_blog_posts_status_published_at ON blog_posts(status, published_at);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their own posts" ON blog_posts
  FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for blog_categories
CREATE POLICY "Public can view categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON blog_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for blog_tags
CREATE POLICY "Public can view tags" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON blog_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for junction tables
CREATE POLICY "Public can view post categories" ON blog_post_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage post categories" ON blog_post_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view post tags" ON blog_post_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage post tags" ON blog_post_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
('Study Tips', 'study-tips', 'Helpful tips and strategies for effective learning'),
('Course Updates', 'course-updates', 'Latest updates and improvements to our courses'),
('Success Stories', 'success-stories', 'Student achievements and testimonials'),
('Industry Insights', 'industry-insights', 'Latest trends and insights in the industry'),
('Tutorials', 'tutorials', 'Step-by-step guides and tutorials');

-- Insert default tags
INSERT INTO blog_tags (name, slug) VALUES
('JavaScript', 'javascript'),
('React', 'react'),
('Beginner', 'beginner'),
('Advanced', 'advanced'),
('Tutorial', 'tutorial'),
('Tips', 'tips'),
('Success', 'success'),
('Learning', 'learning'),
('Web Development', 'web-development'),
('Programming', 'programming');
