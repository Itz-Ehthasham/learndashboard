const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticate, authorize, checkResourceAccess } = require('../middleware/auth');
const { validateCourseCreation, validateCourseUpdate } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level, instructor, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (level) {
      query.level = level;
    }
    
    if (instructor) {
      query.instructor = instructor;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    let coursesQuery = Course.find(query)
      .populate('instructor', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // If student, only show enrolled courses or available courses
    if (req.user.role === 'student') {
      coursesQuery = coursesQuery.or([
        { 'enrolledStudents.student': req.user._id },
        {} // Show all available courses
      ]);
    }

    const courses = await coursesQuery;

    // Get total count for pagination
    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
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
// @desc    Get course by ID
// @access  Private
router.get('/:id', authenticate, checkResourceAccess('course'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName email phone')
      .populate('enrolledStudents.student', 'firstName lastName email')
      .populate('assessments');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: {
        course
      }
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
// @desc    Create new course (admin/trainer only)
// @access  Private (Admin, Trainer)
router.post('/', authenticate, authorize('admin', 'trainer'), validateCourseCreation, async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      instructor,
      category,
      level,
      credits,
      duration,
      maxStudents,
      schedule,
      tags
    } = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }

    // Verify instructor exists and is a trainer
    const instructorUser = await User.findById(instructor);
    if (!instructorUser || instructorUser.role !== 'trainer') {
      return res.status(400).json({
        success: false,
        message: 'Valid instructor (trainer) is required'
      });
    }

    // Create new course
    const course = new Course({
      title,
      description,
      code,
      instructor,
      category,
      level,
      credits,
      duration,
      maxStudents,
      schedule,
      tags: tags || []
    });

    await course.save();

    // Populate instructor details for response
    await course.populate('instructor', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course
      }
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
// @desc    Update course
// @access  Private
router.put('/:id', authenticate, checkResourceAccess('course'), validateCourseUpdate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const {
      title,
      description,
      category,
      level,
      credits,
      duration,
      maxStudents,
      schedule,
      tags,
      materials
    } = req.body;

    // Update fields based on user role
    if (req.user.role === 'admin' || 
        (req.user.role === 'trainer' && course.instructor.toString() === req.user._id.toString())) {
      if (title) course.title = title;
      if (description) course.description = description;
      if (category) course.category = category;
      if (level) course.level = level;
      if (credits) course.credits = credits;
      if (duration) course.duration = duration;
      if (maxStudents) course.maxStudents = maxStudents;
      if (schedule) course.schedule = schedule;
      if (tags) course.tags = tags;
      if (materials) course.materials = materials;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own courses.'
      });
    }

    await course.save();
    await course.populate('instructor', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course
      }
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
// @desc    Delete course (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Soft delete by setting isActive to false
    course.isActive = false;
    await course.save();

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

// @route   POST /api/courses/:id/enroll
// @desc    Enroll student in course
// @access  Private (Student)
router.post('/:id/enroll', authenticate, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is active
    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Enroll the student
    await course.enrollStudent(req.user._id);

    // Update user's enrolled courses
    const user = await User.findById(req.user._id);
    user.enrolledCourses.push(course._id);
    await user.save();

    res.json({
      success: true,
      message: 'Enrolled in course successfully',
      data: {
        course
      }
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while enrolling in course'
    });
  }
});

// @route   POST /api/courses/:id/unenroll
// @desc    Unenroll student from course
// @access  Private (Student)
router.post('/:id/unenroll', authenticate, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Unenroll the student
    await course.unenrollStudent(req.user._id);

    // Update user's enrolled courses
    const user = await User.findById(req.user._id);
    user.enrolledCourses = user.enrolledCourses.filter(
      courseId => courseId.toString() !== course._id.toString()
    );
    await user.save();

    res.json({
      success: true,
      message: 'Unenrolled from course successfully'
    });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while unenrolling from course'
    });
  }
});

// @route   GET /api/courses/stats/overview
// @desc    Get course statistics overview (admin/trainer only)
// @access  Private (Admin, Trainer)
router.get('/stats/overview', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    let matchQuery = { isActive: true };
    
    // If trainer, only show their courses
    if (req.user.role === 'trainer') {
      matchQuery.instructor = req.user._id;
    }

    const totalCourses = await Course.countDocuments(matchQuery);
    
    const coursesByCategory = await Course.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const coursesByLevel = await Course.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);

    const totalEnrollments = await Course.aggregate([
      { $match: matchQuery },
      { $unwind: '$enrolledStudents' },
      { $match: { 'enrolledStudents.status': 'active' } },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);

    const recentCourses = await Course.find(matchQuery)
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalCourses,
        totalEnrollments: totalEnrollments[0]?.total || 0,
        coursesByCategory: coursesByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        coursesByLevel: coursesByLevel.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentCourses
      }
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course statistics'
    });
  }
});

// @route   GET /api/courses/my-courses
// @desc    Get courses for current user (instructor or student)
// @access  Private
router.get('/my-courses', authenticate, async (req, res) => {
  try {
    let courses;
    
    if (req.user.role === 'trainer') {
      // Get courses taught by this instructor
      courses = await Course.find({ instructor: req.user._id, isActive: true })
        .populate('enrolledStudents.student', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      // Get courses enrolled by this student
      courses = await Course.find({
        'enrolledStudents.student': req.user._id,
        'enrolledStudents.status': 'active',
        isActive: true
      })
        .populate('instructor', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else {
      // Admin can see all courses
      courses = await Course.find({ isActive: true })
        .populate('instructor', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        courses
      }
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

module.exports = router;
