import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Video {
  id: string;
  name: string;
  duration: string;
  link: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  cover_photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const CourseView: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      setError('');

      // Fetch course data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch course videos
      const { data: videosData, error: videosError } = await supabase
        .from('course_videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (videosError) throw videosError;

      setCourse(courseData);
      setVideos(videosData || []);
      
      // Set first video as selected by default
      if (videosData && videosData.length > 0) {
        setSelectedVideo(videosData[0]);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Handle YouTube player postMessage to hide branding elements
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only handle messages from YouTube
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        
        // When player is ready, send commands to hide elements
        if (data.event === 'onReady') {
          const iframe = document.querySelector('.youtube-player-wrapper iframe');
          if (iframe && iframe.contentWindow) {
            // Send commands to hide YouTube branding
            iframe.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'setOption',
              args: ['modestbranding', true]
            }), 'https://www.youtube.com');
            
            iframe.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'setOption',
              args: ['showinfo', false]
            }), 'https://www.youtube.com');
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getLevelBadge = (level: string) => {
    const levelConfig = {
      beginner: { color: 'bg-green-100 text-green-800', text: 'Lv 1 – Beginner' },
      intermediate: { color: 'bg-yellow-100 text-yellow-800', text: 'Lv 2 – Intermediate' },
      advanced: { color: 'bg-red-100 text-red-800', text: 'Lv 3 – Advanced' },
      expert: { color: 'bg-purple-100 text-purple-800', text: 'Lv 4 – Expert' },
      mastery: { color: 'bg-indigo-100 text-indigo-800', text: 'Lv 5 – Mastery' }
    };
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDuration = (duration: string) => {
    // Handle various duration formats
    if (duration.includes(':')) {
      return duration;
    } else if (duration.includes('m') && duration.includes('s')) {
      return duration;
    } else if (duration.startsWith('PT')) {
      // ISO 8601 duration format
      const minutes = duration.match(/(\d+)M/)?.[1] || '0';
      const seconds = duration.match(/(\d+)S/)?.[1] || '0';
      return `${minutes}:${seconds.padStart(2, '0')}`;
    }
    return duration;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      // Return embed URL with aggressive parameters to remove ALL YouTube branding
      // rel=0: No related videos at end
      // modestbranding=1: Minimal YouTube branding
      // showinfo=0: No video title/info overlay
      // enablejsapi=1: Enable JavaScript API for control
      // origin: Security origin for the embed
      // controls=1: Show video controls
      // disablekb=0: Enable keyboard controls
      // fs=1: Enable fullscreen button
      // iv_load_policy=3: Disable video annotations
      // cc_load_policy=0: Disable closed captions by default
      // autoplay=0: Don't autoplay
      // loop=0: Don't loop
      // playlist: Prevents "Watch on YouTube" button
      // hl=en: Force English language
      // color=white: White progress bar
      // start=0: Start from beginning
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&enablejsapi=1&origin=${window.location.origin}&controls=1&disablekb=0&fs=1&iv_load_policy=3&cc_load_policy=0&autoplay=0&loop=0&playlist=${videoId}&hl=en&color=white&start=0`;
    }
    
    return url; // Fallback to original URL if parsing fails
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested course could not be found.'}</p>
            <button
              onClick={() => navigate('/admin/courses')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          .youtube-player-wrapper {
            position: relative;
            overflow: hidden;
          }
          
          .youtube-player-wrapper iframe {
            position: relative;
            z-index: 1;
          }
          
          /* Aggressive CSS to hide ALL YouTube branding elements */
          .youtube-player-wrapper iframe[src*="youtube.com"] {
            filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3C/svg%3E#a");
          }
          
          /* Hide YouTube branding overlay */
          .youtube-player-wrapper::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 2;
            background: transparent;
          }
          
          /* Hide specific YouTube elements using CSS */
          .youtube-player-wrapper iframe[src*="youtube.com"] + * {
            display: none !important;
          }
          
          /* Additional YouTube element hiding */
          .youtube-player-wrapper iframe[src*="youtube.com"] ~ * {
            display: none !important;
          }
          
          /* Force hide YouTube branding */
          .youtube-player-wrapper iframe[src*="youtube.com"] {
            -webkit-filter: none !important;
            filter: none !important;
          }
          
          /* Hide YouTube controls that show branding */
          .youtube-player-wrapper iframe[src*="youtube.com"] {
            pointer-events: auto;
          }
          
          /* Ensure no YouTube branding shows through */
          .youtube-player-wrapper {
            background: #000;
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/courses')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Courses
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Course Preview</h1>
                <p className="mt-2 text-gray-600">Viewing course as a student would see it</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/admin/courses/${courseId}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Course
              </button>
            </div>
          </div>
        </div>

        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              {course.cover_photo_url ? (
                <img 
                  className="h-48 w-full object-cover md:w-48" 
                  src={course.cover_photo_url} 
                  alt={course.title} 
                />
              ) : (
                <div className="h-48 w-full md:w-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <svg className="h-24 w-24 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-8">
              <div className="flex items-center space-x-2 mb-4">
                {getLevelBadge(course.level)}
                <span className="text-sm text-gray-500">
                  Created {new Date(course.created_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">{course.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>{videos.length} lessons</span>
                <span>•</span>
                <span>Admin Preview Mode</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lesson Player</h3>
              <p className="text-sm text-gray-600 mb-4">
                Preview videos exactly as students will see them
                <span className="ml-2 text-xs text-amber-600">
                  ⚠️ YouTube warnings in console are normal and don't affect functionality
                </span>
                <span className="ml-2 text-xs text-green-600">
                  ✨ Clean player: No "Watch on YouTube" button or video suggestions
                </span>
              </p>
              {selectedVideo ? (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">{selectedVideo.name}</h4>
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    {selectedVideo.link.includes('youtube.com') || selectedVideo.link.includes('youtu.be') ? (
                      <div className="relative w-full h-full">
                        <div className="youtube-player-wrapper">
                          <iframe
                            src={getYouTubeEmbedUrl(selectedVideo.link)}
                            title={selectedVideo.name}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            onLoad={() => console.log('YouTube video loaded successfully')}
                            onError={() => console.error('Failed to load YouTube video')}
                          />
                        </div>
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          YouTube Preview
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <svg className="h-16 w-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-600">Video preview</p>
                          <p className="text-sm text-gray-500">Link: {selectedVideo.link}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Duration: {formatDuration(selectedVideo.duration)}</span>
                    <span>Lesson {videos.findIndex(v => v.id === selectedVideo.id) + 1} of {videos.length}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>Select a lesson to start learning</p>
                </div>
              )}
            </div>
          </div>

          {/* Lesson List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Course Lessons</h3>
              <div className="space-y-3">
                {videos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                      selectedVideo?.id === video.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            selectedVideo?.id === video.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              selectedVideo?.id === video.id ? 'text-indigo-900' : 'text-gray-900'
                            }`}>
                              {video.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDuration(video.duration)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedVideo?.id === video.id && (
                        <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;
