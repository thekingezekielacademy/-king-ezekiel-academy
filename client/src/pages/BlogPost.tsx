import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaCalendar, FaClock, FaUser, FaTags, FaFolder, FaShare, FaTwitter, FaFacebook, FaLinkedin, FaArrowUp } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';


// Create an anonymous client for public blog access
const supabase = createClient(
  'https://evqerkqiquwxqlizdqmg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cWVya3FpcXV3eHFsaXpkcW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzE0NTUsImV4cCI6MjA3MDI0NzQ1NX0.0hoqOOvJzRFX6zskur2HixoIW2XfAP0fMBwTMGcd7kw',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  status: 'draft' | 'published';
  published_at: string;
  created_at: string;
  updated_at: string;
  categories: Array<{ name: string }>;
  tags: Array<{ name: string }>;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blogPost, setBlogPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
    }
  }, [slug]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the blog post by slug
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_post_categories(
            blog_categories(name)
          ),
          blog_post_tags(
            blog_tags(name)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postsError) {
        console.error('Error fetching blog post:', postsError);
        if (postsError.code === 'PGRST116') {
          setError('Blog post not found');
        } else {
          setError('Failed to load blog post');
        }
        return;
      }

      // Transform the data
      const transformedPost: BlogPostData = {
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt || '',
        featured_image_url: posts.featured_image_url || '',
        status: posts.status,
        published_at: posts.published_at,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        categories: posts.blog_post_categories?.filter((c: any) => c.blog_categories)?.map((c: any) => ({ name: c.blog_categories.name })) || [],
        tags: posts.blog_post_tags?.filter((t: any) => t.blog_tags)?.map((t: any) => ({ name: t.blog_tags.name })) || []
      };

      setBlogPost(transformedPost);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading blog post...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blogPost) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Error</h1>
            <p className="mt-2 text-gray-600">{error || 'Blog post not found'}</p>
            <button
              onClick={() => navigate('/blog')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Set page title */}
      <title>{blogPost?.title || 'Blog Post'} | King Ezekiel Academy</title>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div>

        {/* Blog Post Content */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Featured Image */}
          {blogPost.featured_image_url && (
            <div className="relative">
              <img
                src={blogPost.featured_image_url}
                alt={blogPost.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaCalendar className="w-4 h-4" />
                <span>
                  {new Date(blogPost.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaUser className="w-4 h-4" />
                <span>Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                <span>{getReadingTime(blogPost.content)} min read</span>
              </div>
            </div>

            {/* Categories and Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {blogPost.categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <FaFolder className="w-4 h-4 text-gray-500" />
                  {blogPost.categories.map((category, index) => (
                    <span key={index} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
              {blogPost.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <FaTags className="w-4 h-4 text-gray-500" />
                  {blogPost.tags.map((tag, index) => (
                    <span key={index} className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {blogPost.title}
            </h1>

            {/* Excerpt */}
            {blogPost.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {blogPost.excerpt}
              </p>
            )}

            {/* Table of Contents (for longer posts) */}
            {blogPost.content.length > 1000 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Table of Contents</h3>
                <div className="text-sm text-gray-600">
                  <p>This is a longer article with detailed content. Use the navigation below to jump to specific sections.</p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <div className="whitespace-pre-line">
                {blogPost.content}
              </div>
            </div>

            {/* Social Sharing */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaShare className="w-4 h-4" />
                  <span>Share this article:</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(blogPost.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                    className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                    title="Share on Twitter"
                  >
                    <FaTwitter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Share on Facebook"
                  >
                    <FaFacebook className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                    className="p-2 text-blue-700 hover:text-blue-900 transition-colors"
                    title="Share on LinkedIn"
                  >
                    <FaLinkedin className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
                <span>
                  Published: {new Date(blogPost.published_at).toLocaleDateString()}
                </span>
                <span>
                  Last updated: {new Date(blogPost.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Comment Section */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Join the Discussion</h2>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Comments Coming Soon</h3>
              <p className="text-gray-600">
                We're working on adding a comment system to make our blog more interactive.
              </p>
            </div>
          </div>
        </div>

        {/* Related Posts Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">More from Our Blog</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* This would be populated with related posts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-600 text-sm">More blog posts will appear here as they're published.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110"
        title="Back to Top"
      >
        <FaArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default BlogPost;
