import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaUser, FaEye, FaTag, FaFolder, FaHeart, FaShare, FaComment, FaCalendar, FaBookmark } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  created_at: string;
  likes: number;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image_url: string;
  author: string;
  author_avatar: string;
  author_bio: string;
  published_at: string;
  read_time: string;
  views: number;
  likes: number;
  category: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Dummy blog post data
  const blogPost: BlogPost = {
    id: '1',
    title: 'Mastering React Hooks: A Comprehensive Guide to Modern React Development',
    content: `
      <p class="lead">React Hooks have revolutionized the way we write React components, making them more functional, readable, and maintainable. In this comprehensive guide, we'll explore everything you need to know about React Hooks and how to use them effectively in your projects.</p>

      <h2>The Evolution of React Components</h2>
      <p>Before Hooks, React components were primarily class-based, which often led to complex lifecycle methods and difficult-to-reuse logic. With the introduction of Hooks in React 16.8, functional components became the preferred way to write React code.</p>

      <h2>Understanding useState Hook</h2>
      <p>The <code>useState</code> hook is the most fundamental hook in React. It allows functional components to manage local state without converting them to class components.</p>
      
      <pre><code>import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}</code></pre>

      <h2>Mastering useEffect Hook</h2>
      <p>The <code>useEffect</code> hook is used for side effects in functional components. It's equivalent to componentDidMount, componentDidUpdate, and componentWillUnmount combined.</p>

      <p>Here are some key concepts to remember:</p>
      <ul>
        <li><strong>Dependency Array:</strong> The second argument controls when the effect runs</li>
        <li><strong>Cleanup Function:</strong> Return a function to clean up side effects</li>
        <li><strong>Multiple Effects:</strong> You can use multiple useEffect hooks in one component</li>
      </ul>

      <h2>Custom Hooks: Reusable Logic</h2>
      <p>One of the most powerful features of Hooks is the ability to create custom hooks. This allows you to extract component logic into reusable functions.</p>

      <pre><code>function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}</code></pre>

      <h2>Performance Optimization with useMemo and useCallback</h2>
      <p>React provides additional hooks for performance optimization:</p>
      
      <ul>
        <li><code>useMemo</code>: Memoizes expensive calculations</li>
        <li><code>useCallback</code>: Memoizes functions to prevent unnecessary re-renders</li>
        <li><code>useRef</code>: Persists values between renders without causing re-renders</li>
      </ul>

      <h2>Best Practices and Common Pitfalls</h2>
      <p>While Hooks are powerful, they come with their own set of rules and best practices:</p>

      <ol>
        <li><strong>Only call Hooks at the top level</strong> - Don't call Hooks inside loops, conditions, or nested functions</li>
        <li><strong>Only call Hooks from React functions</strong> - Call Hooks from React function components or custom Hooks</li>
        <li><strong>Use the dependency array correctly</strong> - Include all values that the effect depends on</li>
        <li><strong>Avoid infinite loops</strong> - Be careful with useEffect dependencies</li>
      </ol>

      <h2>Real-World Examples</h2>
      <p>Let's look at a practical example of a custom hook for managing form state:</p>

      <pre><code>function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit
  };
}</code></pre>

      <h2>Conclusion</h2>
      <p>React Hooks have fundamentally changed how we write React applications. They provide a more intuitive way to manage state and side effects while making our code more readable and maintainable.</p>

      <p>By mastering these concepts and following best practices, you'll be able to build more efficient and scalable React applications. Remember, practice is key - the more you use Hooks, the more comfortable you'll become with them.</p>

      <p>Happy coding! 🚀</p>
    `,
    excerpt: 'Learn how to leverage React Hooks to build more efficient and maintainable components. From useState to custom hooks, we cover everything you need to know.',
    featured_image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    author: 'Sarah Johnson',
    author_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    author_bio: 'Senior React Developer with 8+ years of experience building scalable web applications. Passionate about clean code, performance optimization, and teaching others.',
    published_at: '2024-01-15',
    read_time: '12 min read',
    views: 1247,
    likes: 89,
    category: 'Programming',
    tags: ['React', 'JavaScript', 'Frontend', 'Web Development', 'Hooks'],
    meta_title: 'Mastering React Hooks: Complete Guide',
    meta_description: 'Learn React Hooks from basics to advanced patterns. Master useState, useEffect, custom hooks, and performance optimization techniques.'
  };

  // Dummy comments
  const comments: Comment[] = [
    {
      id: '1',
      author: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
      content: 'This is exactly what I needed! The examples are so clear and practical. I\'ve been struggling with useEffect dependencies, but this article cleared everything up. Thanks Sarah!',
      created_at: '2024-01-16T10:30:00Z',
      likes: 12
    },
    {
      id: '2',
      author: 'Maria Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      content: 'The custom hooks section is gold! I\'ve been looking for a good example of how to create reusable logic. The form hook example is going straight into my toolkit.',
      created_at: '2024-01-16T14:15:00Z',
      likes: 8
    },
    {
      id: '3',
      author: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      content: 'Great article! I especially liked the performance optimization section. useMemo and useCallback have been game-changers for my app\'s performance.',
      created_at: '2024-01-17T09:45:00Z',
      likes: 15
    }
  ];

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      // Handle comment submission
      console.log('Comment submitted:', comment);
      setComment('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/blog')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors duration-200"
        >
          <FaArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </button>

        {/* Article Header */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Featured Image */}
          <div className="relative h-96 overflow-hidden">
            <img
              src={blogPost.featured_image_url}
              alt={blogPost.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Category Badge */}
            <div className="absolute top-6 left-6">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getCategoryColor(blogPost.category)}`}>
                <FaFolder className="w-4 h-4 mr-2" />
                {blogPost.category}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-6 right-6 flex space-x-3">
              <button
                onClick={handleBookmark}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isBookmarked 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              >
                <FaBookmark className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-all duration-200"
              >
                <FaShare className="w-5 h-5" />
              </button>
            </div>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute top-20 right-6 bg-white rounded-lg shadow-xl p-4 border">
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors duration-200">
                    Copy Link
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors duration-200">
                    Share on Twitter
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors duration-200">
                    Share on LinkedIn
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Article Content */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {blogPost.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-600">
              <div className="flex items-center">
                <img
                  src={blogPost.author_avatar}
                  alt={blogPost.author}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">{blogPost.author}</p>
                  <p className="text-sm text-gray-500">{blogPost.author_bio}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <FaCalendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(blogPost.published_at)}</span>
                </div>
                <div className="flex items-center">
                  <FaClock className="w-4 h-4 mr-2" />
                  <span>{blogPost.read_time}</span>
                </div>
                <div className="flex items-center">
                  <FaEye className="w-4 h-4 mr-2" />
                  <span>{blogPost.views.toLocaleString()} views</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {blogPost.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <FaTag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Article Body */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100"
              dangerouslySetInnerHTML={{ __html: blogPost.content }}
            />

            {/* Article Footer */}
            <div className="border-t border-gray-200 pt-8 mt-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isLiked 
                        ? 'bg-red-100 text-red-600 border border-red-200' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <FaHeart className={`w-4 h-4 ${isLiked ? 'text-red-600' : ''}`} />
                    <span>{blogPost.likes + (isLiked ? 1 : 0)}</span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Last updated: {formatDate(blogPost.published_at)}
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaComment className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              Comments ({comments.length})
            </h2>
          </div>

          {/* Comment Form - Only for Students */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex items-start space-x-4">
                                 <img
                   src={(user as any)?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'}
                   alt="Your avatar"
                   className="w-10 h-10 rounded-full"
                 />
                <div className="flex-1">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts on this article..."
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    rows={4}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!comment.trim()}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{comment.author}</h4>
                      <span className="text-sm text-gray-500">
                        {formatCommentDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                  <div className="flex items-center mt-3 space-x-4">
                    <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                      <FaHeart className="w-3 h-3" />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sign In Prompt for Non-Students */}
          {!user && (
            <div className="text-center py-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">
                Sign in to join the conversation and share your thoughts!
              </p>
              <button
                onClick={() => navigate('/signin')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                Sign In to Comment
              </button>
            </div>
          )}
        </div>

        {/* Related Articles Suggestion */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Continue Reading
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group cursor-pointer">
              <div className="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors duration-200">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  The Future of Online Education: Trends to Watch
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Discover the latest trends shaping online education...
                </p>
              </div>
            </div>
            <div className="group cursor-pointer">
              <div className="bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition-colors duration-200">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  Building Scalable APIs with Node.js and Express
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Step-by-step guide to building robust, scalable APIs...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
