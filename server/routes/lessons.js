const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/lessons
// @desc    Get all lessons for a course
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    const supabase = req.app.locals.supabase;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course', courseId)
      .eq('is_published', true)
      .order('order', { ascending: true });

    if (error) {
      throw error;
    }

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
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_published', true)
      .single();

    if (error || !lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
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
// @access  Private (Instructors/Admins only)
router.post('/', auth, [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('course').notEmpty().withMessage('Course ID is required'),
  body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer')
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

    // Check if user has permission to create lessons
    if (!['teacher', 'administrator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers and administrators can create lessons.'
      });
    }

    const supabase = req.app.locals.supabase;

    // Verify course exists and user has access
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.body.course)
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (req.user.role !== 'administrator' && course.instructor !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create lessons for your own courses.'
      });
    }

    const lessonData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single();

    if (error) {
      throw error;
    }

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
// @access  Private (Lesson creator or admin only)
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 3, max: 100 }),
  body('content').optional().trim().isLength({ min: 10 }),
  body('order').optional().isInt({ min: 1 })
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

    // Check if lesson exists and user has permission
    const { data: existingLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('*, courses!lessons_course_fkey(*)')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingLesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'administrator' && existingLesson.courses.instructor !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit lessons in your own courses.'
      });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const { data: lesson, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });

  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lesson'
    });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete a lesson
// @access  Private (Lesson creator or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    // Check if lesson exists and user has permission
    const { data: existingLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('*, courses!lessons_course_fkey(*)')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingLesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'administrator' && existingLesson.courses.instructor !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete lessons in your own courses.'
      });
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw error;
    }

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
