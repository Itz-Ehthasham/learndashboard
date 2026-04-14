const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticate, authorize, checkResourceAccess } = require('../middleware/auth');
const { validateCourseCreation, validateCourseUpdate } = require('../middleware/validation');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level, instructor, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    
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

    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    
    let coursesQuery = Course.find(query)
      .populate('instructor', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    
    if (req.user.role === 'student') {
      coursesQuery = coursesQuery.or([
        { 'enrolledStudents.student': req.user._id },
        {} 
      ]);
    }

    const courses = await coursesQuery;

    
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

router.post('/', authenticate, authorize('admin', 'trainer'), validateCourseCreation, async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      instructor,
      category,
      branch,
      level,
      credits,
      duration,
      maxStudents,
      schedule,
      tags
    } = req.body;

    const instructorId =
      req.user.role === 'trainer'
        ? req.user._id
        : instructor;

    
    const codeNormalized = typeof code === 'string' ? code.trim().toUpperCase() : code;
    const existingCourse = await Course.findOne({ code: codeNormalized });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }

    
    const instructorUser = await User.findById(instructorId);
    if (!instructorUser || instructorUser.role !== 'trainer') {
      return res.status(400).json({
        success: false,
        message: 'Valid instructor (trainer) is required'
      });
    }

    const schedulePayload = {
      ...schedule,
      startDate: schedule?.startDate,
      endDate: schedule?.endDate,
      startTime: (schedule?.startTime && String(schedule.startTime).trim()) || '09:00',
      endTime: (schedule?.endTime && String(schedule.endTime).trim()) || '17:00'
    };

    
    const course = new Course({
      title,
      description,
      code: codeNormalized,
      instructor: instructorId,
      category,
      branch,
      level,
      credits,
      duration,
      maxStudents,
      schedule: schedulePayload,
      tags: tags || []
    });

    await course.save();

    
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

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    
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

router.post('/:id/enroll-student', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required',
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment',
      });
    }

    const studentUser = await User.findById(studentId);
    if (!studentUser || studentUser.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Valid student user is required',
      });
    }

    await course.enrollStudent(studentId);

    const alreadyLinked = studentUser.enrolledCourses.some(
      (cid) => cid.toString() === course._id.toString()
    );
    if (!alreadyLinked) {
      studentUser.enrolledCourses.push(course._id);
      await studentUser.save();
    }

    const updated = await Course.findById(course._id).populate('instructor', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Student enrolled in course successfully',
      data: { course: updated },
    });
  } catch (error) {
    console.error('Admin enroll student error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error while enrolling student',
    });
  }
});

router.post('/:id/enroll', authenticate, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    
    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    
    await course.enrollStudent(req.user._id);

    
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

router.post('/:id/unenroll', authenticate, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    
    await course.unenrollStudent(req.user._id);

    
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

router.get('/stats/overview', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    let matchQuery = { isActive: true };
    
    
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

router.get('/my-courses', authenticate, async (req, res) => {
  try {
    let courses;
    
    if (req.user.role === 'trainer') {
      
      courses = await Course.find({ instructor: req.user._id, isActive: true })
        .populate('enrolledStudents.student', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      
      courses = await Course.find({
        'enrolledStudents.student': req.user._id,
        'enrolledStudents.status': 'active',
        isActive: true
      })
        .populate('instructor', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else {
      
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
