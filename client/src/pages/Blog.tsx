import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url?: string;
  author_id: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author?: {
    full_name: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const POSTS_PER_PAGE = 9;
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories and tags
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          supabase.from('blog_categories').select('*').order('name'),
          supabase.from('blog_tags').select('*').order('name')
        ]);

        if (categoriesResponse.error) throw categoriesResponse.error;
        if (tagsResponse.error) throw tagsResponse.error;

        setCategories(categoriesResponse.data || []);
        setTags(tagsResponse.data || []);
      } catch (err) {
        console.error('Error fetching categories and tags:', err);
      }
    };

    fetchCategoriesAndTags();
  }, []);

  // Fetch blog posts
  const fetchPosts = async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(page === 1);
      setLoadingMore(page > 1);

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles(full_name),
          categories:blog_post_categories(
            category:blog_categories(id, name, slug)
          ),
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Apply filters
      if (selectedCategory) {
        query = query.eq('blog_post_categories.category.slug', selectedCategory);
      }
      if (selectedTag) {
        query = query.eq('blog_post_tags.tag.slug', selectedTag);
      }
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,excerpt.ilike.%${debouncedSearchTerm}%`);
      }

      // Apply pagination
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to flatten the relationships
      const transformedPosts = (data || []).map((post: any) => ({
        ...post,
        categories: post.categories?.map((c: any) => c.category).filter(Boolean) || [],
        tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
      }));

      if (append) {
        setPosts(prev => [...prev, ...transformedPosts]);
      } else {
        setPosts(transformedPosts);
      }

      setHasMore(transformedPosts.length === POSTS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts(1, false);
  }, [selectedCategory, selectedTag, debouncedSearchTerm]);

  // Load more posts
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Handle filter changes
  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug === selectedCategory ? '' : categorySlug);
    setCurrentPage(1);
  };

  const handleTagChange = (tagSlug: string) => {
    setSelectedTag(tagSlug === selectedTag ? '' : tagSlug);
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get category color
  const getCategoryColor = (categoryName: string) => {
    const colors = {
      'Study Tips': 'bg-green-100 text-green-800',
      'Course Updates': 'bg-blue-100 text-blue-800',
      'Success Stories': 'bg-purple-100 text-purple-800',
      'Industry Insights': 'bg-orange-100 text-orange-800',
      'Tutorials': 'bg-indigo-100 text-indigo-800'
    };
    return colors[categoryName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover helpful tips, industry insights, and success stories to accelerate your learning journey
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search */}
          <div className="mb-6">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Categories:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === '' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.slug 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Tags:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleTagChange('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === '' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                All
              </button>
              {tags.slice(0, 8).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagChange(tag.slug)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag.slug 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchPosts(1, false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">No blog posts found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Featured Image */}
                  {post.featured_image_url && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.slice(0, 2).map((category) => (
                          <span
                            key={category.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category.name)}`}
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      <button
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="hover:text-indigo-600 transition-colors text-left"
                      >
                        {post.title}
                      </button>
                    </h2>
                    
                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(post.published_at)}</span>
                      {post.author && (
                        <span>By {post.author.full_name}</span>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mb-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingMore ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    'Load More Posts'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;
