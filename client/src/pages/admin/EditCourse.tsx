import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Video {
  id?: string;
  name: string;
  duration: string;
  link: string;
}

interface CourseData {
  title: string;
  description: string;
  level: string;
  coverPhoto?: File;
  videos: Video[];
}

const EditCourse: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    level: 'beginner',
    coverPhoto: undefined,
    videos: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newVideo, setNewVideo] = useState({ name: '', duration: '', link: '' });
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course data
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch course videos
      const { data: videos, error: videosError } = await supabase
        .from('course_videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (videosError) throw videosError;

      setCourseData({
        title: course.title || '',
        description: course.description || '',
        level: course.level || 'beginner',
        coverPhoto: undefined,
        videos: videos || []
      });
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CourseData, value: string) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const handleVideoInputChange = (field: keyof Video, value: string) => {
    setNewVideo(prev => ({ ...prev, [field]: value }));
  };

  const addVideo = () => {
    if (newVideo.name && newVideo.duration && newVideo.link) {
      setCourseData(prev => ({
        ...prev,
        videos: [...prev.videos, { ...newVideo }]
      }));
      setNewVideo({ name: '', duration: '', link: '' });
    }
  };

  const removeVideo = (index: number) => {
    setCourseData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setCourseData(prev => ({ ...prev, coverPhoto: files[0] }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCourseData(prev => ({ ...prev, coverPhoto: files[0] }));
    }
  };

  const handleUpdateCourse = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!courseData.title || !courseData.description || courseData.videos.length === 0) {
        setError('Please fill in all required fields and add at least one video');
        return;
      }

      let coverPhotoUrl = undefined;

      // Upload cover photo if provided
      if (courseData.coverPhoto) {
        try {
          const fileExt = courseData.coverPhoto.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `course-covers/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('course-covers')
            .upload(filePath, courseData.coverPhoto);
          
          if (uploadError) {
            console.warn('Cover photo upload failed, continuing without it:', uploadError.message);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('course-covers')
              .getPublicUrl(filePath);
            coverPhotoUrl = publicUrl;
          }
        } catch (uploadErr) {
          console.warn('Cover photo upload failed, continuing without it:', uploadErr);
        }
      }

      // Update the course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: courseData.title,
          description: courseData.description,
          level: courseData.level,
          ...(coverPhotoUrl && { cover_photo_url: coverPhotoUrl })
        })
        .eq('id', courseId);

      if (courseError) throw courseError;

      // Delete existing videos
      const { error: deleteError } = await supabase
        .from('course_videos')
        .delete()
        .eq('course_id', courseId);

      if (deleteError) throw deleteError;

      // Insert new videos
      const videosToInsert = courseData.videos.map((video, index) => ({
        course_id: courseId,
        name: video.name,
        duration: video.duration,
        link: video.link,
        order_index: index
      }));

      const { error: videosError } = await supabase
        .from('course_videos')
        .insert(videosToInsert);

      if (videosError) throw videosError;

      setSuccess('Course updated successfully!');
      setTimeout(() => {
        navigate('/admin/courses');
      }, 1500);

    } catch (err) {
      console.error('Error updating course:', err);
      setError('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !courseData.title) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
              <p className="mt-2 text-gray-600">Update your course information and content</p>
            </div>
            <button
              onClick={() => navigate('/admin/courses')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ← Back to Courses
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5.707 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Course Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Details</h2>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Course Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter course title"
              />
            </div>

            {/* Course Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Description *
              </label>
              <textarea
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe what students will learn in this course"
              />
            </div>

            {/* Course Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Level *
              </label>
              <select
                value={courseData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="beginner">Lv 1 – Beginner</option>
                <option value="intermediate">Lv 2 – Intermediate</option>
                <option value="advanced">Lv 3 – Advanced</option>
                <option value="expert">Lv 4 – Expert</option>
                <option value="mastery">Lv 5 – Mastery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Videos</h2>
          
          {/* Add New Video Form */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Video</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={newVideo.name}
                onChange={(e) => handleVideoInputChange('name', e.target.value)}
                placeholder="Video Name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newVideo.duration}
                onChange={(e) => handleVideoInputChange('duration', e.target.value)}
                placeholder="Duration (e.g., 15:30)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <input
                type="url"
                value={newVideo.link}
                onChange={(e) => handleVideoInputChange('link', e.target.value)}
                placeholder="Video Link (YouTube embed or direct URL)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={addVideo}
              disabled={!newVideo.name || !newVideo.duration || !newVideo.link}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add New Video
            </button>
          </div>

          {/* Videos List */}
          {courseData.videos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Videos ({courseData.videos.length})</h3>
              <div className="space-y-3">
                {courseData.videos.map((video, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{video.name}</p>
                      <p className="text-sm text-gray-600">Duration: {video.duration}</p>
                      <p className="text-sm text-gray-600 truncate">Link: {video.link}</p>
                    </div>
                    <button
                      onClick={() => removeVideo(index)}
                      className="ml-4 px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cover Photo Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cover Photo</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {courseData.coverPhoto ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Selected file: {courseData.coverPhoto.name}</p>
                <button
                  onClick={() => setCourseData(prev => ({ ...prev, coverPhoto: undefined }))}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop an image here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    browse
                  </button>
                </p>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/admin/courses')}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateCourse}
            disabled={loading || !courseData.title || !courseData.description || courseData.videos.length === 0}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;
