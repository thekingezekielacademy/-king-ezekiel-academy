import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProgressRing from '../../components/ProgressRing';
import AdvancedVideoPlayer from '../../components/AdvancedVideoPlayer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const LessonPlayer: React.FC = () => {
  const navigate = useNavigate();
  const { id, lessonId } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  // Fetch course and lesson data
  useEffect(() => {
    const fetchCourseAndLesson = async () => {
      if (!id || !lessonId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // First, refresh the session to ensure we have a valid token
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
        
        if (sessionError) {
          console.log('⚠️ Session refresh failed, trying to get current session:', sessionError);
          const { data: currentSession } = await supabase.auth.getSession();
          if (!currentSession.session) {
            setError('Authentication required. Please sign in again.');
            setLoading(false);
            return;
          }
        }
        
        // Fetch course with all videos
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            course_videos (
              id,
              name,
              duration,
              link,
              order_index
            )
          `)
          .eq('id', id)
          .single();
        
        if (courseError) {
          console.error('❌ Error fetching course:', courseError);
          throw courseError;
        }
        
        if (courseData) {
          console.log('✅ Course data received:', courseData);
          setCourse(courseData);
          
          // Find the current lesson by lessonId
          const videos = courseData.course_videos || [];
          const sortedVideos = videos.sort((a: any, b: any) => a.order_index - b.order_index);
          
          // Try to find lesson by ID first, then by order index
          let foundVideo = videos.find((v: any) => v.id === lessonId);
          if (!foundVideo) {
            // If lessonId is a number, treat it as order index
            const lessonIndex = parseInt(lessonId) - 1;
            foundVideo = sortedVideos[lessonIndex];
          }
          
          if (foundVideo) {
            setCurrentVideo(foundVideo);
            setCurrentLessonIndex(sortedVideos.findIndex((v: any) => v.id === foundVideo.id));
          } else {
            // Default to first video if lesson not found
            if (sortedVideos.length > 0) {
              setCurrentVideo(sortedVideos[0]);
              setCurrentLessonIndex(0);
            }
          }
        } else {
          setError('Course not found');
        }
      } catch (err) {
        console.error('❌ Error fetching course:', err);
        setError(`Failed to load course: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndLesson();
  }, [id, lessonId]);

  // Handle video player events
  const handleVideoPlay = () => {
    console.log(`Lesson ${lessonId} video started playing`);
    // You can add analytics tracking here
  };

  const handleVideoPause = () => {
    console.log(`Lesson ${lessonId} video paused`);
    // You can add progress tracking here
  };

  const handleVideoEnded = () => {
    console.log(`Lesson ${lessonId} video completed`);
    // You can add completion tracking here
  };

  const nextLesson = () => {
    if (course?.course_videos && currentLessonIndex < course.course_videos.length - 1) {
      const nextVideo = course.course_videos[currentLessonIndex + 1];
      navigate(`/course/${id}/lesson/${nextVideo.id}`);
    }
  };

  const prevLesson = () => {
    if (course?.course_videos && currentLessonIndex > 0) {
      const prevVideo = course.course_videos[currentLessonIndex - 1];
      navigate(`/course/${id}/lesson/${prevVideo.id}`);
    }
  };

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Check if video is YouTube
  const isYouTubeVideo = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/courses')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No course or video data
  if (!course || !currentVideo) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-700 font-medium mb-3">Lesson not found</p>
            <button 
              onClick={() => navigate('/courses')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Back to Courses Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Want to explore more courses? 🚀</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block md:col-span-3 bg-white border rounded-xl h-fit p-4">
          <div className="font-bold mb-3">Lessons</div>
          <div className="space-y-2">
            {course.course_videos?.sort((a: any, b: any) => a.order_index - b.order_index).map((video: any, index: number) => (
              <div 
                key={video.id} 
                className={`px-3 py-2 rounded border cursor-pointer ${currentVideo.id === video.id ? 'bg-primary-50 border-primary-200 text-primary-700' : 'hover:bg-gray-50'}`}
                onClick={() => navigate(`/course/${id}/lesson/${video.id}`)}
              >
                {video.name || `Lesson ${index + 1}`}
              </div>
            ))}
          </div>
        </aside>

        {/* Player */}
        <main className="col-span-12 md:col-span-6">
          <div className="bg-white rounded-xl border overflow-hidden mb-4">
            <div className="p-4 border-b flex items-center justify-between gap-4">
              <div>
                <div className="font-bold">{currentVideo.name}</div>
                <div className="h-1.5 bg-gray-100 rounded mt-2">
                  <div className="h-1.5 bg-primary-500 rounded w-1/5 transition-all" />
                </div>
              </div>
              <div className="hidden sm:block">
                <ProgressRing size={52} strokeWidth={6} progress={20} />
              </div>
            </div>
            <div className="w-full overflow-hidden" style={{ minHeight: '400px', height: '60vh', maxHeight: '600px' }}>
              {isYouTubeVideo(currentVideo.link) ? (
                <AdvancedVideoPlayer
                  src={getYouTubeVideoId(currentVideo.link) || ''}
                  type="youtube"
                  title={currentVideo.name}
                  autoplay={false}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={handleVideoEnded}
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                  <div className="text-center">
                    <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">Video Player</p>
                    <p className="text-sm text-gray-300">Video source not supported</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-700">Downloadable resources • Transcript • Notes</div>
              <div className="bg-primary-50 border border-primary-100 p-3 rounded text-sm text-primary-800">🔥 Great job! You’re on track — keep going.</div>
              <div className="flex items-center justify-between">
                <button
                  onClick={prevLesson}
                  disabled={!course?.course_videos || currentLessonIndex <= 0}
                  className={`px-4 py-2 rounded-lg border ${!course?.course_videos || currentLessonIndex <= 0 ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  Previous Lesson
                </button>
                <button 
                  onClick={nextLesson} 
                  disabled={!course?.course_videos || currentLessonIndex >= (course.course_videos?.length || 0) - 1}
                  className={`px-4 py-2 rounded-lg border ${!course?.course_videos || currentLessonIndex >= (course.course_videos?.length || 0) - 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                >
                  Next Lesson
                </button>
              </div>
            </div>
          </div>

          {/* Mobile lessons list under video */}
          <div className="block md:hidden">
            <div className="bg-white border rounded-xl p-4">
              <div className="font-bold mb-3">Lessons</div>
              <div className="space-y-2">
                {course.course_videos?.sort((a: any, b: any) => a.order_index - b.order_index).map((video: any, index: number) => (
                  <div
                    key={video.id}
                    className={`px-3 py-2 rounded border cursor-pointer ${currentVideo.id === video.id ? 'bg-primary-50 border-primary-200 text-primary-700' : 'hover:bg-gray-50'}`}
                    onClick={() => navigate(`/course/${id}/lesson/${video.id}`)}
                  >
                    {video.name || `Lesson ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Right rail */}
        <aside className="col-span-12 md:col-span-3 space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold mb-1">Up Next</div>
            <div className="text-sm text-gray-600">
              {course.course_videos && currentLessonIndex < course.course_videos.length - 1 
                ? course.course_videos[currentLessonIndex + 1]?.name || `Lesson ${currentLessonIndex + 2}`
                : 'This is the last lesson'
              }
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold mb-1">Daily Streak</div>
            <div className="text-sm text-gray-600">You’ve learned 3 days in a row</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="font-semibold mb-1">Related Courses</div>
            <div className="text-sm text-gray-600">Suggestions curated for you</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LessonPlayer;


