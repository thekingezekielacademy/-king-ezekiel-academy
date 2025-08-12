import React, { useState, useEffect } from 'react';
import { FaSearch, FaClock, FaUser, FaBook, FaTag, FaLock, FaUnlock, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import TrialManager from '../utils/trialManager';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Transformed fields for display
  category: string;
  duration: string;
  instructor: string;
  rating: number;
  students: number;
  cover_photo: string;
  lessons: number;
}

const Courses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSort, setSelectedSort] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasTrialAccess, setHasTrialAccess] = useState(false);
  const COURSES_PER_PAGE = 10;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has trial access
  const checkTrialAccess = async () => {
    if (!user?.id) return;
    
    try {
      // First check localStorage for trial status
      const localTrial = localStorage.getItem('user_trial_status');
      
      if (localTrial) {
        try {
          const parsedTrial = JSON.parse(localTrial);
                  // Recalculate days remaining - use floor to get exact days, not rounded up
        const now = new Date();
        const endDate = new Date(parsedTrial.endDate);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
          
          const hasAccess = parsedTrial.isActive && daysRemaining > 0;
          setHasTrialAccess(hasAccess);
          console.log('Trial access check from localStorage:', hasAccess, 'days remaining:', daysRemaining);
          return;
        } catch (parseError) {
          console.log('Failed to parse localStorage trial data');
        }
      }
      
      // If no localStorage trial, check if this is a new user and initialize trial
      // For new users, assume they're within 7 days if no created_at or if created_at is recent
      const userCreatedAt = user.created_at ? new Date(user.created_at) : new Date();
      const daysSinceCreation = Math.ceil((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // If user is new (no created_at) or within 7 days, give them trial
      if (!user.created_at || daysSinceCreation <= 7) {
        // This is a new user within 7 days, initialize trial
        const startDate = userCreatedAt;
        // Set end date to exactly 7 days from start (midnight to midnight)
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        // Calculate exact days remaining
        const now = new Date();
        const timeDiff = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        
        const newTrialStatus = {
          isActive: true,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysRemaining,
          isExpired: daysRemaining <= 0
        };
        
        // Save to localStorage
        localStorage.setItem('user_trial_status', JSON.stringify(newTrialStatus));
        setHasTrialAccess(true);
        console.log('✅ Initialized trial for new user in Courses:', newTrialStatus);
      } else {
        // User is older than 7 days, no trial
        setHasTrialAccess(false);
        console.log('User is older than 7 days, no trial available');
      }
      
      // Try database query as well (for when table exists)
      try {
        const trialAccess = await TrialManager.hasTrialAccess(user.id);
        setHasTrialAccess(trialAccess);
        console.log('Trial access check from database:', trialAccess);
      } catch (dbError) {
        console.log('Database table user_trials not available yet');
      }
    } catch (error) {
      console.error('Error in checkTrialAccess:', error);
      setHasTrialAccess(false);
    }
  };

  // Fetch courses from database with pagination
  const fetchCourses = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      console.log(`🔍 Fetching courses page ${page}...`);
      
      // First, refresh the session to ensure we have a valid token
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        console.log('⚠️ Session refresh failed, trying to get current session:', sessionError);
        // If refresh fails, try to get current session
        const { data: currentSession } = await supabase.auth.getSession();
        if (!currentSession.session) {
          console.log('❌ No valid session found');
          setError('Authentication required. Please sign in again.');
          if (page === 0) setLoading(false);
          else setLoadingMore(false);
          return;
        }
      }
      
      let query = supabase
        .from('courses')
        .select(`
          *,
          course_videos (
            id,
            name,
            duration,
            order_index
          )
        `);

      // Apply sorting based on selected option
      if (selectedSort === 'latest') {
        query = query.order('created_at', { ascending: false });
      } else if (selectedSort === 'most-enrolled') {
        query = query.order('students', { ascending: false });
      } else {
        // Default: all courses, newest first
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
        // For latest and most-enrolled, limit to 10 courses total
        query = query.limit(10);
      } else {
        // For all courses, use pagination
        query = query.range(page * COURSES_PER_PAGE, (page + 1) * COURSES_PER_PAGE - 1);
      }

      const { data, error: fetchError } = await query;
      
      console.log(`📊 Supabase response for page ${page}:`, { data, error: fetchError });
      
      if (fetchError) {
        console.error('❌ Supabase error:', fetchError);
        
        // Handle specific authentication errors
        if (fetchError.code === 'PGRST303' || fetchError.message?.includes('JWT expired')) {
          console.log('🔄 JWT expired, attempting to refresh session...');
          
          // Try to refresh the session and retry
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('❌ Failed to refresh session:', refreshError);
            setError('Authentication expired. Please sign in again.');
            if (page === 0) setLoading(false);
            else setLoadingMore(false);
            return;
          }
          
          // Retry the courses fetch after refresh
          let retryQuery = supabase
            .from('courses')
            .select(`
              *,
              course_videos (
                id,
                name,
                duration,
                order_index
              )
            `);

          // Apply sorting based on selected option
          if (selectedSort === 'latest') {
            retryQuery = retryQuery.order('created_at', { ascending: false });
          } else if (selectedSort === 'most-enrolled') {
            retryQuery = retryQuery.order('students', { ascending: false });
          } else {
            // Default: all courses, newest first
            retryQuery = retryQuery.order('created_at', { ascending: false });
          }

          // Apply pagination
          if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
            // For latest and most-enrolled, limit to 10 courses total
            retryQuery = retryQuery.limit(10);
          } else {
            // For all courses, use pagination
            retryQuery = retryQuery.range(page * COURSES_PER_PAGE, (page + 1) * COURSES_PER_PAGE - 1);
          }

          const { data: retryData, error: retryError } = await retryQuery;
          
          if (retryError) {
            throw retryError;
          }
          
          if (retryData) {
            console.log(`✅ Courses data received after refresh for page ${page}:`, retryData);
                              const transformedCourses = retryData.map(course => ({
                    ...course,
                    // Add real data from videos
                    category: 'general', // Default category since it doesn't exist in DB
                    duration: calculateTotalDuration(course.course_videos || []),
                    instructor: 'King Ezekiel Academy', // Default instructor since it doesn't exist in DB
                    rating: 4.5, // Default rating since it doesn't exist in DB
                    students: 0, // Default students since it doesn't exist in DB
                    cover_photo: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
                    lessons: course.course_videos?.length || 0
                  }));
            
            if (append) {
              setCourses(prev => [...prev, ...transformedCourses]);
            } else {
              setCourses(transformedCourses);
            }
            
                    // Check if there are more courses
        if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
          setHasMore(false); // No pagination for latest/most-enrolled
        } else {
          setHasMore(retryData.length === COURSES_PER_PAGE);
        }
        setCurrentPage(page);
            
            if (page === 0) setLoading(false);
            else setLoadingMore(false);
            return;
          }
        }
        
        throw fetchError;
      }
      
      if (data) {
        console.log(`✅ Courses data received for page ${page}:`, data);
                          // Transform data to match our interface
                  const transformedCourses = data.map(course => ({
                    ...course,
                    // Add real data from videos
                    category: 'general', // Default category since it doesn't exist in DB
                    duration: calculateTotalDuration(course.course_videos || []),
                    instructor: 'King Ezekiel Academy', // Default instructor since it doesn't exist in DB
                    rating: 4.5, // Default rating since it doesn't exist in DB
                    students: 0, // Default students since it doesn't exist in DB
                    cover_photo: course.cover_photo_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
                    lessons: course.course_videos?.length || 0
                  }));
        
        if (append) {
          setCourses(prev => [...prev, ...transformedCourses]);
        } else {
          setCourses(transformedCourses);
        }
        
        // Check if there are more courses
        if (selectedSort === 'latest' || selectedSort === 'most-enrolled') {
          setHasMore(false); // No pagination for latest/most-enrolled
        } else {
          setHasMore(data.length === COURSES_PER_PAGE);
        }
        setCurrentPage(page);
        
        console.log(`🔄 Transformed courses for page ${page}:`, transformedCourses);
        console.log(`📊 Has more courses: ${data.length === COURSES_PER_PAGE}`);
      } else {
        console.log(`⚠️ No data received from Supabase for page ${page}`);
        if (!append) setCourses([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
      setError(`Failed to load courses from database: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (page === 0) setLoading(false);
      else setLoadingMore(false);
    }
  };

  // Load more courses function
  const loadMoreCourses = () => {
    if (hasMore && !loadingMore) {
      fetchCourses(currentPage + 1, true);
    }
  };

  // Helper function to calculate total duration from videos
  const calculateTotalDuration = (videos: any[]): string => {
    if (!videos || videos.length === 0) return '0 min';
    
    let totalMinutes = 0;
    let totalSeconds = 0;
    
    videos.forEach(video => {
      const duration = video.duration;
      if (duration) {
        // Handle different duration formats: "5:30", "5 min", "5m 30s", etc.
        if (duration.includes(':')) {
          const parts = duration.split(':');
          if (parts.length === 2) {
            totalMinutes += parseInt(parts[0]) || 0;
            totalSeconds += parseInt(parts[1]) || 0;
          } else if (parts.length === 3) {
            totalMinutes += parseInt(parts[0]) || 0;
            totalMinutes += (parseInt(parts[1]) || 0) * 60;
            totalSeconds += parseInt(parts[2]) || 0;
          }
        } else if (duration.includes('min') || duration.includes('m')) {
          const match = duration.match(/(\d+)/);
          if (match) totalMinutes += parseInt(match[1]) || 0;
        } else if (duration.includes('h') || duration.includes('hour')) {
          const match = duration.match(/(\d+)/);
          if (match) totalMinutes += (parseInt(match[1]) || 0) * 60;
        } else {
          // Try to parse as just a number (assume minutes)
          const num = parseInt(duration);
          if (!isNaN(num)) totalMinutes += num;
        }
      }
    });
    
    // Convert seconds to minutes
    totalMinutes += Math.floor(totalSeconds / 60);
    totalSeconds = totalSeconds % 60;
    
    // Format the result
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      if (mins === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${mins}m`;
      }
    } else {
      return `${totalMinutes}m`;
    }
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSelectedSort(newSort);
    setCurrentPage(0);
    setHasMore(true);
    fetchCourses(0, false);
  };

  // Fetch courses on component mount only
  useEffect(() => {
    fetchCourses(0, false);
    if (user?.id) {
      checkTrialAccess();
    }
  }, [user?.id]); // Run when user changes

  // Debug logging for trial access
  useEffect(() => {
    console.log('🔍 Trial access debug:', {
      user: user?.id,
      hasTrialAccess,
      subActive: localStorage.getItem('subscription_active') === 'true',
      trialStatus: localStorage.getItem('user_trial_status')
    });
  }, [user?.id, hasTrialAccess]);

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Categories are hardcoded since they don't exist in DB yet
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' }
  ];

  // Sorting options
  const sortOptions = [
    { value: 'all', label: 'All Courses' },
    { value: 'latest', label: 'Latest (Last 10)' },
    { value: 'most-enrolled', label: 'Most Enrolled (Top 10)' }
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    ...Array.from(new Set(courses.map(course => course.level)))
      .filter(level => level)
      .map(level => {
        const levelConfig = {
          beginner: 'Lv 1 – Beginner',
          intermediate: 'Lv 2 – Intermediate',
          advanced: 'Lv 3 – Advanced',
          expert: 'Lv 4 – Expert',
          mastery: 'Lv 5 – Mastery'
        };
        return {
          value: level,
          label: levelConfig[level as keyof typeof levelConfig] || level
        };
      })
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (course.description && course.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
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
    if (user && (localStorage.getItem('subscription_active') === 'true' || hasTrialAccess)) {
      // User has active subscription or trial access - go to dashboard
      navigate('/dashboard');
    } else if (user) {
      // User is signed in but no active subscription or trial - go to profile to upgrade
      navigate('/profile');
    } else {
      // User is not signed in - go to sign in page
      navigate('/signin');
    }
  };

  const handleEnroll = (courseId: string) => {
    if (user && (localStorage.getItem('subscription_active') === 'true' || hasTrialAccess)) {
      // User is signed in and has active subscription OR trial access - go to course overview
      navigate(`/course/${courseId}/overview`);
    } else if (user) {
      // User is signed in but no active subscription or trial - go to profile to upgrade
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
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Explore Our Courses
          </h1>
                          {user && (
                <button
                  onClick={() => {
                    if (!loading) {
                      setCurrentPage(0);
                      setHasMore(true);
                      setError(null);
                      fetchCourses(0, false);
                    }
                  }}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  title="Refresh courses"
                >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master the most in-demand digital skills with our comprehensive courses. Register as a member to access all courses.
          </p>
        </div>

        {/* Membership Notice - Only show when subscription is not active and no trial access */}
        {(!user || (localStorage.getItem('subscription_active') !== 'true' && !hasTrialAccess)) && (
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
          {/* Search Bar - Full Width on Mobile */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              {levels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              {sortOptions.map(sort => (
                <option key={sort.value} value={sort.value}>{sort.label}</option>
              ))}
            </select>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== 'all' || selectedLevel !== 'all' || selectedSort !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {categories.find(c => c.value === selectedCategory)?.label}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedLevel !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {levels.find(l => l.value === selectedLevel)?.label}
                  <button
                    onClick={() => setSelectedLevel('all')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedSort !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {sortOptions.find(s => s.value === selectedSort)?.label}
                  <button
                    onClick={() => handleSortChange('all')}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                  handleSortChange('all');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => {
                  setCurrentPage(0);
                  setHasMore(true);
                  fetchCourses(0, false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              {error.includes('Authentication') && (
                <button 
                  onClick={() => navigate('/signin')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                <img 
                  src={course.cover_photo || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop'} 
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
                  <span className="text-sm text-gray-500 capitalize">{course.category?.replace('-', ' ') || 'General'}</span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description || 'No description available'}</p>
                
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <FaClock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaBook className="h-4 w-4" />
                    <span>{course.lessons} {course.lessons === 1 ? 'lesson' : 'lessons'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaUser className="h-4 w-4" />
                    <span>{course.instructor}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-primary-600">
                      {user && (localStorage.getItem('subscription_active') === 'true' || hasTrialAccess) ? 'Full Access' : 'Membership Access'}
                    </span>
                  </div>
                  <button onClick={() => handleEnroll(course.id)} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2">
                    {user && (localStorage.getItem('subscription_active') === 'true' || hasTrialAccess) ? (
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
        )}

        {/* Load More Button */}
        {hasMore && !loading && !error && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreCourses}
              disabled={loadingMore}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {loadingMore ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="font-semibold">Loading More Courses...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="font-semibold">Load More Courses</span>
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Showing {courses.length} courses • Click to load {COURSES_PER_PAGE} more
            </p>
          </div>
        )}

        {filteredCourses.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
          </div>
        )}

        {/* Membership CTA - Only show when subscription is not active and no trial access */}
        {(!user || (localStorage.getItem('subscription_active') !== 'true' && !hasTrialAccess)) && (
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
