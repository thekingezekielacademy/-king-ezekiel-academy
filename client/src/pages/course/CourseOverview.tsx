import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProgressRing from '../../components/ProgressRing';

const CourseOverview: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const startCourse = () => {
    navigate(`/course/${id}/lesson/1`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Back to Courses Button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-semibold">Browse all courses 📚</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-primary-500 text-white p-8 mb-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Course Title</h1>
            <p className="text-primary-100 mb-6">A clean, cinematic overview that invites you to begin immediately.</p>
            <div className="flex items-center gap-4">
              <button onClick={startCourse} className="bg-white text-primary-700 font-semibold px-5 py-2 rounded-lg hover:bg-primary-50 transition">Start Course</button>
              <div className="bg-white/10 rounded-full p-1">
                <ProgressRing size={64} strokeWidth={6} progress={0} />
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">Lessons</div>
            <div className="text-xl font-bold">12</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">Duration</div>
            <div className="text-xl font-bold">5h 40m</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm text-gray-500">Level</div>
            <div className="text-xl font-bold capitalize">Beginner</div>
          </div>
        </div>

        {/* Rewards & Motivation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">Course Rewards</h2>
            <ul className="text-gray-700 list-disc list-inside space-y-1">
              <li>🏅 Badge unlocked at 100%</li>
              <li>🎓 Certificate available on completion</li>
            </ul>
          </div>
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">Motivation</h2>
            <p className="text-gray-700">“In 7 days, you could master this skill — let’s start today.”</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseOverview;


