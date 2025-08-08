const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all published courses with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      level,
      instructor,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = { isPublished: true };
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (instructor) filter.instructor = instructor;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName')
      .populate({
        path: 'lessons',
        match: { isPublished: true },
        options: { sort: { order: 1 } }
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get course statistics
    const enrollmentCount = await Progress.countDocuments({ course: course._id });
    const completedCount = await Progress.countDocuments({ 
      course: course._id, 
      status: 'completed' 
    });

    const courseData = course.toJSON();
    courseData.statistics = {
      enrollmentCount,
      completedCount,
      completionRate: enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0
    };

    res.json({
      success: true,
      data: courseData
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course'
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Instructor/Admin only)
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('category').isIn(['web-development', 'digital-marketing', 'ui-ux-design', 'data-analytics', 'branding', 'graphic-design', 'content-creation', 'business-skills']).withMessage('Invalid category'),
  body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
  body('duration').isFloat({ min: 0.5 }).withMessage('Duration must be at least 0.5 hours'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative')
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
        message: 'Only instructors and administrators can create courses'
      });
    }

    const {
      title,
      description,
      longDescription,
      category,
      level,
      duration,
      price,
      originalPrice,
      tags,
      requirements,
      learningOutcomes
    } = req.body;

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    const course = new Course({
      title,
      slug,
      description,
      longDescription,
      category,
      level,
      duration,
      price,
      originalPrice,
      instructor: req.user.id,
      tags: tags || [],
      requirements: requirements || [],
      learningOutcomes: learningOutcomes || []
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });

  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A course with this slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating course'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (Course instructor or admin only)
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('category').optional().isIn(['web-development', 'digital-marketing', 'ui-ux-design', 'data-analytics', 'branding', 'graphic-design', 'content-creation', 'business-skills']).withMessage('Invalid category'),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
  body('duration').optional().isFloat({ min: 0.5 }).withMessage('Duration must be at least 0.5 hours'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative')
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

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'administrator') {
      return res.status(403).json({
        success: false,
        message: 'Only the course instructor or administrator can update this course'
      });
    }

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not published yet'
      });
    }

    // Check if user is already enrolled
    const existingProgress = await Progress.findOne({
      user: req.user.id,
      course: req.params.id
    });

    if (existingProgress) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Create progress record
    const progress = new Progress({
      user: req.user.id,
      course: req.params.id,
      currentLesson: course.lessons[0] || null
    });

    await progress.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(req.params.id, {
      $inc: { enrollmentCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: progress
    });

  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while enrolling in course'
    });
  }
});

// @route   GET /api/courses/:id/progress
// @desc    Get user's progress in a course
// @access  Private
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.id,
      course: req.params.id
    }).populate('course').populate('currentLesson');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching progress'
    });
  }
});

module.exports = router;
