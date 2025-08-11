const express = require('express');
const { body, validationResult } = require('express-validator');
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
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    const supabase = req.app.locals.supabase;

    // Build filter object
    let query = supabase
      .from('courses')
      .select('*, profiles!courses_instructor_fkey(name)')
      .eq('is_published', true);

    if (category) query = query.eq('category', category);
    if (level) query = query.eq('level', level);
    if (instructor) query = query.eq('instructor', instructor);
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    // Apply sorting and pagination
    const sortOrder = order === 'desc' ? false : true;
    query = query.order(sort, { ascending: sortOrder });
    
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: courses, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit))
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
    const supabase = req.app.locals.supabase;

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        profiles!courses_instructor_fkey(name),
        lessons!lessons_course_fkey(*)
      `)
      .eq('id', req.params.id)
      .eq('is_published', true)
      .single();

    if (error || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get course statistics
    const { count: enrollmentCount } = await supabase
      .from('progress')
      .select('*', { count: 'exact', head: true })
      .eq('course', req.params.id);

    const { count: completedCount } = await supabase
      .from('progress')
      .select('*', { count: 'exact', head: true })
      .eq('course', req.params.id)
      .eq('status', 'completed');

    // Add statistics to course object
    course.statistics = {
      enrollmentCount: enrollmentCount || 0,
      completedCount: completedCount || 0
    };

    res.json({
      success: true,
      data: course
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
// @access  Private (Instructors/Admins only)
router.post('/', auth, [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').notEmpty().withMessage('Category is required'),
  body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Level must be beginner, intermediate, or advanced'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
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

    // Check if user has permission to create courses
    if (!['teacher', 'administrator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and administrators can create courses.'
      });
    }

    const supabase = req.app.locals.supabase;
    const courseData = {
      ...req.body,
      instructor: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating course'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (Course instructor or admin only)
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('category').optional().notEmpty(),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('price').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const supabase = req.app.locals.supabase;

    // Check if course exists and user has permission
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'administrator' && existingCourse.instructor !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own courses.'
      });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (Course instructor or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    // Check if course exists and user has permission
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'administrator' && existingCourse.instructor !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own courses.'
      });
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course'
    });
  }
});

module.exports = router;
