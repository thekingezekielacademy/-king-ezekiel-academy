import React, { useState } from 'react';
import { FaSearch, FaClock, FaUser, FaEye, FaTag, FaFolder } from 'react-icons/fa';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  featured_image_url: string;
  author: string;
  published_at: string;
  read_time: string;
  views: number;
  category: string;
  tags: string[];
}

const Blog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Dummy data for beautiful interface
  const dummyPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Mastering React Hooks: A Comprehensive Guide',
      excerpt: 'Learn how to leverage React Hooks to build more efficient and maintainable components. From useState to custom hooks, we cover everything you need to know.',
      featured_image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      author: 'Sarah Johnson',
      published_at: '2024-01-15',
      read_time: '8 min read',
      views: 1247,
      category: 'Programming',
      tags: ['React', 'JavaScript', 'Frontend']
    },
    {
      id: '2',
      title: 'The Future of Online Education: Trends to Watch',
      excerpt: 'Discover the latest trends shaping online education and how they\'re revolutionizing the way we learn. From AI-powered learning to virtual reality classrooms.',
      featured_image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      author: 'Michael Chen',
      published_at: '2024-01-12',
      read_time: '12 min read',
      views: 2156,
      category: 'Education',
      tags: ['Online Learning', 'Technology', 'Future']
    },
    {
      id: '3',
      title: 'Building Scalable APIs with Node.js and Express',
      excerpt: 'Step-by-step guide to building robust, scalable APIs using Node.js and Express. Learn best practices for authentication, validation, and error handling.',
      featured_image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      author: 'David Rodriguez',
      published_at: '2024-01-10',
      read_time: '15 min read',
      views: 1893,
      category: 'Programming',
      tags: ['Node.js', 'Express', 'API', 'Backend']
    },
    {
      id: '4',
      title: 'Effective Study Techniques for Online Learners',
      excerpt: 'Maximize your online learning experience with proven study techniques. From time management to active learning strategies, boost your productivity.',
      featured_image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      author: 'Emily Watson',
      published_at: '2024-01-08',
      read_time: '6 min read',
      views: 3421,
      category: 'Study Tips',
      tags: ['Learning', 'Productivity', 'Online Education']
    },
    {
      id: '5',
      title: 'CSS Grid vs Flexbox: When to Use Each',
      excerpt: 'Master the art of CSS layout with this comprehensive comparison of Grid and Flexbox. Learn when and how to use each for optimal results.',
      featured_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      author: 'Alex Thompson',
      published_at: '2024-01-05',
      read_time: '10 min read',
      views: 1678,
      category: 'Programming',
      tags: ['CSS', 'Frontend', 'Layout', 'Design']
    },
    {
      id: '6',
      title: 'The Psychology of Learning: How to Retain Information Better',
      excerpt: 'Understand the science behind learning and memory. Discover techniques that will help you retain information longer and learn more effectively.',
      featured_image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      author: 'Dr. Lisa Park',
      published_at: '2024-01-03',
      read_time: '14 min read',
      views: 2987,
      category: 'Psychology',
      tags: ['Learning', 'Memory', 'Psychology', 'Education']
    }
  ];

  const categories = [
    { name: 'all', label: 'All Posts', count: dummyPosts.length },
    { name: 'Programming', label: 'Programming', count: dummyPosts.filter(p => p.category === 'Programming').length },
    { name: 'Education', label: 'Education', count: dummyPosts.filter(p => p.category === 'Education').length },
    { name: 'Study Tips', label: 'Study Tips', count: dummyPosts.filter(p => p.category === 'Study Tips').length },
    { name: 'Psychology', label: 'Psychology', count: dummyPosts.filter(p => p.category === 'Psychology').length }
  ];

  const allTags = Array.from(new Set(dummyPosts.flatMap(post => post.tags)));

  const filteredPosts = dummyPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Programming': 'bg-blue-100 text-blue-800 border-blue-200',
      'Education': 'bg-green-100 text-green-800 border-green-200',
      'Study Tips': 'bg-purple-100 text-purple-800 border-purple-200',
      'Psychology': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover insights, tips, and stories from our community of learners and educators. 
            Stay updated with the latest trends in education and technology.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.name
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {category.label}
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {category.count}
                </span>
              </button>
            ))}
          </div>

          {/* Popular Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {allTags.slice(0, 8).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
              >
                <FaTag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
            >
              {/* Featured Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(post.category)}`}>
                    <FaFolder className="w-3 h-3 mr-1" />
                    {post.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black bg-opacity-75 text-white">
                    <FaEye className="w-3 h-3 mr-1" />
                    {post.views.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta Information */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <FaUser className="w-4 h-4 mr-1" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center">
                      <FaClock className="w-4 h-4 mr-1" />
                      <span>{post.read_time}</span>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {formatDate(post.published_at)}
                  </span>
                </div>

                {/* Read More Button */}
                <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Read Article
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        {filteredPosts.length > 0 && (
          <div className="text-center mb-12">
            <button className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105">
              Load More Articles
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or category filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
