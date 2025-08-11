import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaTrophy, 
  FaFire, 
  FaGraduationCap, 
  FaPlay, 
  FaStar, 
  FaUsers, 
  FaCrown,
  FaMedal,
  FaBookOpen,
  FaChartLine,
  FaGift,
  FaClock,
  FaCheckCircle,
  FaArrowRight,
  FaHeart,
  FaShare,
  FaUser
} from 'react-icons/fa';

interface Course {
  id: string;
  title: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  category: string;
  instructor: string;
  rating: number;
  enrolledStudents: number;
  image: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  earned: boolean;
  earnedDate?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(4);
  const [totalXP, setTotalXP] = useState(2840);
  const [level, setLevel] = useState(8);
  const [trialDaysLeft, setTrialDaysLeft] = useState(3);
  
  // Check subscription status
  const [subActive, setSubActive] = useState<boolean>(() => {
    try { return localStorage.getItem('subscription_active') === 'true'; } catch { return false; }
  });

  // Mock data - in real app, this would come from your Supabase database
  const [currentCourse] = useState<Course>({
    id: '1',
    title: 'Digital Marketing 101',
    progress: 65,
    totalLessons: 24,
    completedLessons: 16,
    category: 'Marketing',
    instructor: 'Sarah Johnson',
    rating: 4.8,
    enrolledStudents: 1247,
    image: '/api/placeholder/300/200'
  });

  const [recommendedCourses] = useState<Course[]>([
    {
      id: '2',
      title: 'Advanced Excel Mastery',
      progress: 0,
      totalLessons: 18,
      completedLessons: 0,
      category: 'Business',
      instructor: 'Michael Chen',
      rating: 4.9,
      enrolledStudents: 2156,
      image: '/api/placeholder/300/200'
    },
    {
      id: '3',
      title: 'Social Media Strategy',
      progress: 0,
      totalLessons: 22,
      completedLessons: 0,
      category: 'Marketing',
      instructor: 'Emma Davis',
      rating: 4.7,
      enrolledStudents: 1893,
      image: '/api/placeholder/300/200'
    }
  ]);

  const [badges] = useState<Badge[]>([
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      earned: true,
      earnedDate: '2 days ago'
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Learn for 7 days in a row',
      icon: '🔥',
      earned: true,
      earnedDate: '1 day ago'
    },
    {
      id: '3',
      name: 'Course Master',
      description: 'Complete a full course',
      icon: '🏆',
      earned: false,
      progress: 65
    }
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Early Bird',
      description: 'Complete a lesson before 9 AM',
      xp: 50,
      earned: true,
      earnedDate: '3 days ago'
    },
    {
      id: '2',
      title: 'Speed Learner',
      description: 'Complete 5 lessons in one day',
      xp: 100,
      earned: false
    },
    {
      id: '3',
      title: 'Social Butterfly',
      description: 'Share 3 courses with friends',
      xp: 75,
      earned: true,
      earnedDate: '1 day ago'
    }
  ]);

  const [motivationalQuotes] = useState([
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
  ]);

  const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'text-purple-600';
    if (level >= 5) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || user?.email?.split('@')[0] || 'Student'}! 👋
              </h1>
              <p className="text-gray-600">Continue your learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <FaFire className="text-orange-500" />
                <span className="text-sm font-medium text-blue-900">
                  {currentStreak} day streak
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-lg">
                <FaStar className="text-purple-500" />
                <span className="text-sm font-medium text-purple-900">
                  {totalXP} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Admin Status Banner */}
          {isAdmin && (
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaCrown className="text-purple-600 text-xl" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">🎉 Admin Access Granted!</h3>
                    <p className="text-sm text-gray-700">
                      You are signed in as an administrator. You can now access admin features and manage courses.
                    </p>
                    {/* Debug info for admins - shows if someone was redirected */}
                    {location.state?.redirectedFrom && (
                      <p className="text-xs text-purple-600 mt-1 italic">
                        🔍 Debug: User was redirected from {location.state.redirectedFrom}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/admin')}
                  className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <span>Go to Admin Panel</span>
                  <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          )}

          {/* Trial Banner - Only show when subscription is not active */}
          {trialDaysLeft > 0 && !subActive && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaClock className="text-red-500 text-xl" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Trial Ending Soon</h3>
                  <p className="text-sm text-gray-700">
                    Your trial ends in {trialDaysLeft} days — keep your progress alive for only ₦2,500/month.
                    <span className="block text-xs text-gray-500 mt-1">Click "Upgrade Now" to manage your subscription</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  // Navigate to Profile page where subscription management is located
                  navigate('/profile');
                }}
                className="bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <span>Upgrade Now</span>
                <FaArrowRight className="text-sm" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress & Achievement Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
                <div className="flex items-center space-x-2">
                  <FaChartLine className="text-green-500" />
                  <span className="text-sm text-gray-600">Level {level}</span>
                </div>
              </div>

              {/* Current Course Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{currentCourse.title}</h3>
                  <span className="text-sm text-gray-600">
                    {currentCourse.completedLessons}/{currentCourse.totalLessons} lessons
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getProgressColor(currentCourse.progress)} transition-all duration-300`}
                      style={{ width: `${currentCourse.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-600">
                      {currentCourse.progress}% complete
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Keep going! 🚀
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Milestone */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <FaTrophy className="text-yellow-500 text-xl" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Next Milestone</h4>
                    <p className="text-sm text-gray-600">
                      Complete this course to unlock your 'Certified Marketer' badge!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Courses */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                <span className="text-sm text-gray-600">AI-powered suggestions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedCourses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {course.title.split(' ').map(word => word[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{course.instructor}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center space-x-1">
                            <FaStar className="text-yellow-400" />
                            <span>{course.rating}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FaUsers className="text-gray-400" />
                            <span>{course.enrolledStudents}</span>
                          </span>
                        </div>
                        <div className="mt-3">
                          <button onClick={() => navigate(`/course/${course.id}`)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                            Start Learning
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Standing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <FaCrown className="text-yellow-500 text-xl" />
                    <h4 className="font-semibold text-gray-900">Class Ranking</h4>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">Top 35%</p>
                  <p className="text-sm text-gray-600">You're ahead of 65% of learners in your batch!</p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <FaUsers className="text-blue-500 text-xl" />
                    <h4 className="font-semibold text-gray-900">Community</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">1,247</p>
                  <p className="text-sm text-gray-600">Students learning with you</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Streak & Motivation */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaFire className="text-orange-500 text-xl" />
                <h3 className="font-semibold text-gray-900">Learning Streak</h3>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-orange-600 mb-2">{currentStreak}</div>
                <p className="text-sm text-gray-600">days in a row</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800">
                  🔥 You've learned {currentStreak} days in a row. Keep it up!
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 italic">"{currentQuote}"</p>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Badges Earned</h3>
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div key={badge.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                    badge.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="text-2xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{badge.name}</h4>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                      {badge.earned && badge.earnedDate && (
                        <p className="text-xs text-green-600">Earned {badge.earnedDate}</p>
                      )}
                      {!badge.earned && badge.progress && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${badge.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{badge.progress}% complete</p>
                        </div>
                      )}
                    </div>
                    {badge.earned && <FaCheckCircle className="text-green-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* XP & Level */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Experience Points</h3>
              
              <div className="text-center mb-4">
                <div className={`text-3xl font-bold ${getLevelColor(level)}`}>
                  Level {level}
                </div>
                <p className="text-sm text-gray-600">{totalXP} total XP</p>
              </div>

              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    achievement.earned ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">+{achievement.xp} XP</div>
                      {achievement.earned && (
                        <FaCheckCircle className="text-green-500 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaCrown className="text-yellow-500 text-xl" />
                <h3 className="font-semibold text-gray-900">Subscription</h3>
              </div>
              
              {trialDaysLeft > 0 ? (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-red-600 mb-2">{trialDaysLeft}</div>
                  <p className="text-sm text-gray-600">trial days left</p>
                  <div className="bg-red-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-red-800 font-medium">
                      Upgrade to keep learning!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-600 mb-2">Active</div>
                  <p className="text-sm text-gray-600">subscription</p>
                  <div className="bg-green-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-green-800 font-medium">
                      You have full access! 🎉
                    </p>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Manage Subscription</span>
                <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Continue Learning CTA */}
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl shadow-sm border border-primary-200 p-6">
              <div className="text-center">
                <FaPlay className="text-primary-600 text-2xl mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Continue Learning</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pick up where you left off in {currentCourse.title}
                </p>
                <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                  Resume Course
                </button>
              </div>
            </div>

            {/* Profile Update Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
                <span className="text-sm text-gray-600">Update your information</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Name cannot be changed here</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                {/* Manage Profile Button */}
                <div className="pt-4">
                  <button 
                    onClick={() => navigate('/profile')}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                  >
                    <FaUser className="text-sm" />
                    <span>Manage Full Profile</span>
                    <FaArrowRight className="text-sm" />
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Access complete profile settings, bio, and subscription management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
