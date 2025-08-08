const express = require('express');
const { body, validationResult } = require('express-validator');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/lessons/course/:courseId
// @desc    Get all lessons for a course
// @access  Public (for published lessons)
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { includeUnpublished = false } = req.query;

    const filter = { course: courseId };
    if (!includeUnpublished) {
      filter.isPublished = true;
    }

    const lessons = await Lesson.find(filter)
      .sort({ order: 1 })
      .select('-__v');

    res.json({
      success: true,
      data: lessons
    });

  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lessons'
    });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get single lesson by ID
// @access  Private (for enrolled users)
router.get('/:id', auth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title instructor');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is enrolled in the course
    const progress = await Progress.findOne({
      user: req.user.id,
      course: lesson.course._id
    });

    if (!progress && req.user.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to access lessons'
      });
    }

    // Check if lesson is published (unless user is admin)
    if (!lesson.isPublished && req.user.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'This lesson is not published yet'
      });
    }

    res.json({
      success: true,
      data: lesson
    });

  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lesson'
    });
  }
});

// @route   POST /api/lessons
// @desc    Create a new lesson
// @access  Private (Instructor/Admin only)
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('lessonType').optional().isIn(['video', 'text', 'interactive', 'quiz', 'project']).withMessage('Invalid lesson type'),
  body('estimatedTime').optional().isInt({ min: 1 }).withMessage('Estimated time must be a positive integer')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user is instructor or admin
    if (!['teacher', 'administrator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only instructors and administrators can create lessons'
      });
    }

    const {
      title,
      description,
      content,
      course,
      order,
      lessonType,
      videoUrl,
      videoDuration,
      thumbnail,
      isFree,
      estimatedTime,
      tags,
      difficulty
    } = req.body;

    // Verify course exists and user is the instructor
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (courseDoc.instructor.toString() !== req.user.id && req.user.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'Only the course instructor or administrator can add lessons'
      });
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    const lesson = new Lesson({
      title,
      slug,
      description,
      content,
      course,
      order,
      lessonType: lessonType || 'video',
      videoUrl: videoUrl || '',
      videoDuration: videoDuration || 0,
      thumbnail: thumbnail || '',
      isFree: isFree || false,
      estimatedTime: estimatedTime || 15,
      tags: tags || [],
      difficulty: difficulty || 'medium'
    });

    await lesson.save();

    // Add lesson to course
    await Course.findByIdAndUpdate(course, {
      $push: { lessons: lesson._id }
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });

  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating lesson'
    });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update a lesson
// @access  Private (Lesson instructor or admin only)
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('content').optional().trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('lessonType').optional().isIn(['video', 'text', 'interactive', 'quiz', 'project']).withMessage('Invalid lesson type'),
  body('estimatedTime').optional().isInt({ min: 1 }).withMessage('Estimated time must be a positive integer')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is course instructor or admin
    if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'Only the course instructor or administrator can update this lesson'
      });
    }

    // Update lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: updatedLesson
    });

  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lesson'
    });
  }
});

// @route   POST /api/lessons/:id/complete
// @desc    Mark lesson as completed
// @access  Private
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { timeSpent = 0 } = req.body;

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Find user's progress in this course
    const progress = await Progress.findOne({
      user: req.user.id,
      course: lesson.course
    });

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to mark lessons as completed'
      });
    }

    // Mark lesson as completed
    await progress.completeLesson(lesson._id, timeSpent);

    // Update current lesson to next one
    const nextLesson = await Lesson.findOne({
      course: lesson.course,
      order: lesson.order + 1,
      isPublished: true
    });

    if (nextLesson) {
      progress.currentLesson = nextLesson._id;
      await progress.save();
    }

    res.json({
      success: true,
      message: 'Lesson marked as completed',
      data: progress
    });

  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing lesson'
    });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete a lesson
// @access  Private (Lesson instructor or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is course instructor or admin
    if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'Only the course instructor or administrator can delete this lesson'
      });
    }

    // Remove lesson from course
    await Course.findByIdAndUpdate(lesson.course._id, {
      $pull: { lessons: lesson._id }
    });

    // Delete lesson
    await Lesson.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });

  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting lesson'
    });
  }
});

module.exports = router;
