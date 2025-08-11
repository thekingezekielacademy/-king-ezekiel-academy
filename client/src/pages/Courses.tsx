import React, { useState } from 'react';
import { FaSearch, FaClock, FaUser, FaBook, FaTag, FaLock, FaUnlock, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  rating: number;
  students: number;
  image: string;
}

const Courses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  const dummyCourses: Course[] = [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      description: "Master HTML, CSS, JavaScript, React, and Node.js to build modern web applications from scratch.",
      category: "web-development",
      level: "beginner",
      duration: "40 hours",
      instructor: "John Smith",
      rating: 4.8,
      students: 1250,
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop"
    },
    {
      id: 2,
      title: "Digital Marketing Mastery",
      description: "Learn SEO, social media marketing, email campaigns, and Google Ads to grow any business online.",
      category: "digital-marketing",
      level: "intermediate",
      duration: "25 hours",
      instructor: "Sarah Johnson",
      rating: 4.7,
      students: 890,
      image: "https://images.unsplash.com/photo-1557838923-2985c318be48?w=400&h=250&fit=crop"
    },
    {
      id: 3,
      title: "UI/UX Design Fundamentals",
      description: "Master user interface and user experience design principles to create beautiful, functional digital products.",
      category: "ui-ux-design",
      level: "beginner",
      duration: "30 hours",
      instructor: "Mike Chen",
      rating: 4.9,
      students: 650,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop"
    },
    {
      id: 4,
      title: "Data Analytics with Python",
      description: "Learn Python programming and data analysis to extract insights from complex datasets.",
      category: "data-analytics",
      level: "intermediate",
      duration: "35 hours",
      instructor: "Emily Davis",
      rating: 4.6,
      students: 720,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop"
    },
    {
      id: 5,
      title: "Brand Identity & Logo Design",
      description: "Create memorable brand identities, logos, and visual systems that stand out in today's competitive market.",
      category: "branding",
      level: "beginner",
      duration: "20 hours",
      instructor: "Alex Rodriguez",
      rating: 4.5,
      students: 480,
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop"
    },
    {
      id: 6,
      title: "Content Creation & Social Media",
      description: "Master content creation for social media platforms and build an engaged audience for your brand.",
      category: "content-creation",
      level: "beginner",
      duration: "18 hours",
      instructor: "Lisa Wang",
      rating: 4.4,
      students: 320,
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=250&fit=crop"
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'digital-marketing', label: 'Digital Marketing' },
    { value: 'ui-ux-design', label: 'UI/UX Design' },
    { value: 'data-analytics', label: 'Data Analytics' },
    { value: 'branding', label: 'Branding' },
    { value: 'content-creation', label: 'Content Creation' }
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Lv 1 – Beginner' },
    { value: 'intermediate', label: 'Lv 2 – Intermediate' },
    { value: 'advanced', label: 'Lv 3 – Advanced' },
    { value: 'expert', label: 'Lv 4 – Expert' },
    { value: 'mastery', label: 'Lv 5 – Mastery' }
  ];

  const filteredCourses = dummyCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web-development': return <FaBook />;
      case 'digital-marketing': return <FaTag />;
      case 'ui-ux-design': return <FaUser />;
      case 'data-analytics': return <FaTag />;
      case 'branding': return <FaTag />;
      case 'content-creation': return <FaTag />;
      default: return <FaBook />;
    }
  };

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      beginner: { label: 'Lv 1 – Beginner', color: 'bg-green-100 text-green-800' },
      intermediate: { label: 'Lv 2 – Intermediate', color: 'bg-yellow-100 text-yellow-800' },
      advanced: { label: 'Lv 3 – Advanced', color: 'bg-red-100 text-red-800' },
      expert: { label: 'Lv 4 – Expert', color: 'bg-purple-100 text-purple-800' },
      mastery: { label: 'Lv 5 – Mastery', color: 'bg-indigo-100 text-indigo-800' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const goToAccess = () => {
    if (user && localStorage.getItem('subscription_active') === 'true') {
      // User has active subscription - go to dashboard
      navigate('/dashboard');
    } else if (user) {
      // User is signed in but no active subscription - go to profile to upgrade
      navigate('/profile');
    } else {
      // User is not signed in - go to sign in page
      navigate('/signin');
    }
  };

  const handleEnroll = (courseId: number) => {
    if (user && localStorage.getItem('subscription_active') === 'true') {
      // User is signed in and has active subscription - go to course
      navigate(`/course/${courseId}`);
    } else if (user) {
      // User is signed in but no active subscription - go to profile to upgrade
      navigate('/profile');
    } else {
      // User is not signed in - go to sign in page
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore Our Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master the most in-demand digital skills with our comprehensive courses. Register as a member to access all courses.
          </p>
        </div>

        {/* Membership Notice - Only show when subscription is not active */}
        {(!user || localStorage.getItem('subscription_active') !== 'true') && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-center space-x-3">
              <FaLock className="h-6 w-6" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Membership Required</h3>
                <p className="text-primary-100">Register as a member to access all courses and start your learning journey</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {levels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  {getLevelBadge(course.level)}
                </div>
                <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1">
                  <FaGraduationCap className="h-3 w-3" />
                  <span>{user && localStorage.getItem('subscription_active') === 'true' ? 'Full Access' : 'Membership'}</span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  {getCategoryIcon(course.category)}
                  <span className="text-sm text-gray-500 capitalize">{course.category.replace('-', ' ')}</span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <FaClock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaUser className="h-4 w-4" />
                    <span>{course.instructor}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-primary-600">
                      {user && localStorage.getItem('subscription_active') === 'true' ? 'Full Access' : 'Membership Access'}
                    </span>
                  </div>
                  <button onClick={() => handleEnroll(course.id)} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2">
                    {user && localStorage.getItem('subscription_active') === 'true' ? (
                      <>
                        <FaUnlock className="h-4 w-4" />
                        <span>Start Learning</span>
                      </>
                    ) : user ? (
                      <>
                        <FaLock className="h-4 w-4" />
                        <span>Upgrade to Access</span>
                      </>
                    ) : (
                      <>
                        <FaLock className="h-4 w-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
          </div>
        )}

        {/* Membership CTA - Only show when subscription is not active */}
        {(!user || localStorage.getItem('subscription_active') !== 'true') && (
          <div className="mt-12 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-primary-900 mb-4">
                Ready to Start Learning?
              </h3>
              <p className="text-lg text-primary-700 mb-6">
                Join thousands of students who have transformed their careers with our comprehensive course library.
              </p>
              <button onClick={goToAccess} className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 font-semibold">
                {user ? 'Subscribe to Access' : 'Sign In'}
              </button>
            </div>
          </div>
        )}

        {/* Success Message for Active Subscribers */}
        {user && localStorage.getItem('subscription_active') === 'true' && (
          <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 text-center border border-green-200">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-green-900 mb-4">
                🎉 You Have Full Access!
              </h3>
              <p className="text-lg text-green-700 mb-6">
                Your active subscription gives you unlimited access to all courses. Start learning and unlock your potential!
              </p>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Active Subscription</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
