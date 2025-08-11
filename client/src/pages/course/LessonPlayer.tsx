import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProgressRing from '../../components/ProgressRing';
import AdvancedVideoPlayer from '../../components/AdvancedVideoPlayer';

const LessonPlayer: React.FC = () => {
  const navigate = useNavigate();
  const { id, lessonId } = useParams();

  const current = Number(lessonId) || 1;
  
  // Sample video data for demonstration
  const [currentVideo] = useState({
    id: lessonId,
    name: `Lesson ${lessonId} - Advanced Concepts`,
    link: 'https://youtu.be/hd8LZ8hJtVs?si=e8NvHi5mjf7yehnh', // Sample YouTube video
    duration: '37:51'
  });

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
    const next = current + 1;
    navigate(`/course/${id}/lesson/${next}`);
  };

  const prevLesson = () => {
    if (current > 1) {
      const prev = current - 1;
      navigate(`/course/${id}/lesson/${prev}`);
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
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`px-3 py-2 rounded border ${Number(lessonId) === i + 1 ? 'bg-primary-50 border-primary-200 text-primary-700' : 'hover:bg-gray-50'}`}>Lesson {i + 1}</div>
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
                  disabled={current <= 1}
                  className={`px-4 py-2 rounded-lg border ${current <= 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  Previous Lesson
                </button>
                <button onClick={nextLesson} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
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
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded border ${current === i + 1 ? 'bg-primary-50 border-primary-200 text-primary-700' : 'hover:bg-gray-50'}`}
                    onClick={() => navigate(`/course/${id}/lesson/${i + 1}`)}
                  >
                    Lesson {i + 1}
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
            <div className="text-sm text-gray-600">Lesson {Number(lessonId) + 1} preview</div>
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


