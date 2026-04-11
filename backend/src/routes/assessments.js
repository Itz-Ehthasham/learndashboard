const express = require('express');
const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const { authenticate, authorize, checkResourceAccess } = require('../middleware/auth');
const { validateAssessmentCreation, validateAssessmentUpdate } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/assessments
// @desc    Get all assessments
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, course, type, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (course) {
      query.course = course;
    }
    
    if (type) {
      query.type = type;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    let assessmentsQuery = Assessment.find(query)
      .populate('course', 'title code')
      .populate('instructor', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter based on user role
    if (req.user.role === 'student') {
      // Students can only see assessments for courses they're enrolled in
      const enrolledCourses = await Course.find({
        'enrolledStudents.student': req.user._id,
        'enrolledStudents.status': 'active'
      }).select('_id');
      
      const courseIds = enrolledCourses.map(course => course._id);
      query.course = { $in: courseIds };
    } else if (req.user.role === 'trainer') {
      // Trainers can only see assessments for their courses
      const instructorCourses = await Course.find({
        instructor: req.user._id
      }).select('_id');
      
      const courseIds = instructorCourses.map(course => course._id);
      query.course = { $in: courseIds };
    }

    const assessments = await Assessment.find(query)
      .populate('course', 'title code')
      .populate('instructor', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Assessment.countDocuments(query);

    res.json({
      success: true,
      data: {
        assessments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessments'
    });
  }
});

// @route   GET /api/assessments/:id
// @desc    Get assessment by ID
// @access  Private
router.get('/:id', authenticate, checkResourceAccess('assessment'), async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('course', 'title code instructor')
      .populate('course.instructor', 'firstName lastName email')
      .populate('instructor', 'firstName lastName email')
      .populate('submissions.student', 'firstName lastName email')
      .populate('submissions.gradedBy', 'firstName lastName email');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // For students, hide correct answers unless specified
    if (req.user.role === 'student' && !assessment.showCorrectAnswers) {
      assessment.questions.forEach(question => {
        question.correctAnswer = undefined;
      });
    }

    res.json({
      success: true,
      data: {
        assessment
      }
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessment'
    });
  }
});

// @route   POST /api/assessments
// @desc    Create new assessment (admin/trainer only)
// @access  Private (Admin, Trainer)
router.post('/', authenticate, authorize('admin', 'trainer'), validateAssessmentCreation, async (req, res) => {
  try {
    const {
      title,
      description,
      course,
      type,
      maxScore,
      passingScore,
      duration,
      scheduledDate,
      dueDate,
      instructions,
      questions,
      allowMultipleAttempts,
      maxAttempts,
      randomizeQuestions,
      showResults,
      showCorrectAnswers
    } = req.body;

    // Verify course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (req.user.role === 'trainer' && courseDoc.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create assessments for your own courses.'
      });
    }

    // Create new assessment
    const assessment = new Assessment({
      title,
      description,
      course,
      instructor: req.user._id,
      type,
      maxScore,
      passingScore,
      duration,
      scheduledDate,
      dueDate,
      instructions,
      questions: questions || [],
      allowMultipleAttempts: allowMultipleAttempts || false,
      maxAttempts: maxAttempts || 1,
      randomizeQuestions: randomizeQuestions || false,
      showResults: showResults !== undefined ? showResults : true,
      showCorrectAnswers: showCorrectAnswers || false
    });

    await assessment.save();

    // Add assessment to course
    courseDoc.assessments.push(assessment._id);
    await courseDoc.save();

    // Populate for response
    await assessment.populate('course', 'title code');
    await assessment.populate('instructor', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: {
        assessment
      }
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating assessment'
    });
  }
});

// @route   PUT /api/assessments/:id
// @desc    Update assessment
// @access  Private
router.put('/:id', authenticate, checkResourceAccess('assessment'), validateAssessmentUpdate, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    const {
      title,
      description,
      maxScore,
      passingScore,
      duration,
      scheduledDate,
      dueDate,
      instructions,
      questions,
      allowMultipleAttempts,
      maxAttempts,
      randomizeQuestions,
      showResults,
      showCorrectAnswers,
      isPublished
    } = req.body;

    // Check permissions
    if (req.user.role === 'admin' || 
        (req.user.role === 'trainer' && assessment.instructor.toString() === req.user._id.toString())) {
      if (title) assessment.title = title;
      if (description) assessment.description = description;
      if (maxScore) assessment.maxScore = maxScore;
      if (passingScore !== undefined) assessment.passingScore = passingScore;
      if (duration) assessment.duration = duration;
      if (scheduledDate) assessment.scheduledDate = scheduledDate;
      if (dueDate) assessment.dueDate = dueDate;
      if (instructions !== undefined) assessment.instructions = instructions;
      if (questions) assessment.questions = questions;
      if (allowMultipleAttempts !== undefined) assessment.allowMultipleAttempts = allowMultipleAttempts;
      if (maxAttempts) assessment.maxAttempts = maxAttempts;
      if (randomizeQuestions !== undefined) assessment.randomizeQuestions = randomizeQuestions;
      if (showResults !== undefined) assessment.showResults = showResults;
      if (showCorrectAnswers !== undefined) assessment.showCorrectAnswers = showCorrectAnswers;
      if (isPublished !== undefined) assessment.isPublished = isPublished;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own assessments.'
      });
    }

    await assessment.save();
    await assessment.populate('course', 'title code');
    await assessment.populate('instructor', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: {
        assessment
      }
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating assessment'
    });
  }
});

// @route   DELETE /api/assessments/:id
// @desc    Delete assessment (admin/trainer only)
// @access  Private (Admin, Trainer)
router.delete('/:id', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check permissions
    if (req.user.role === 'trainer' && assessment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own assessments.'
      });
    }

    // Soft delete by setting isActive to false
    assessment.isActive = false;
    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting assessment'
    });
  }
});

// @route   POST /api/assessments/:id/submit
// @desc    Submit assessment (student only)
// @access  Private (Student)
router.post('/:id/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers are required and must be an array'
      });
    }

    const assessment = await Assessment.findById(req.params.id)
      .populate('course', 'title code');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if student is enrolled in the course
    const isEnrolled = assessment.course.enrolledStudents.some(
      enrollment => enrollment.student.toString() === req.user._id.toString() && 
                   enrollment.status === 'active'
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not enrolled in this course.'
      });
    }

    // Submit assessment
    await assessment.submitAssessment(req.user._id, answers, timeSpent);

    res.json({
      success: true,
      message: 'Assessment submitted successfully'
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting assessment'
    });
  }
});

// @route   POST /api/assessments/:id/grade/:studentId
// @desc    Grade student submission (admin/trainer only)
// @access  Private (Admin, Trainer)
router.post('/:id/grade/:studentId', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const { score, feedback } = req.body;

    if (score === undefined || score < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid score is required'
      });
    }

    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check permissions
    if (req.user.role === 'trainer' && assessment.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only grade your own assessments.'
      });
    }

    // Grade submission
    await assessment.gradeSubmission(req.params.studentId, score, feedback, req.user._id);

    res.json({
      success: true,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while grading submission'
    });
  }
});

// @route   GET /api/assessments/my-assessments
// @desc    Get assessments for current user
// @access  Private
router.get('/my-assessments', authenticate, async (req, res) => {
  try {
    let assessments;
    
    if (req.user.role === 'trainer') {
      // Get assessments created by this instructor
      assessments = await Assessment.find({ instructor: req.user._id, isActive: true })
        .populate('course', 'title code')
        .populate('submissions.student', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      // Get assessments for courses student is enrolled in
      const enrolledCourses = await Course.find({
        'enrolledStudents.student': req.user._id,
        'enrolledStudents.status': 'active'
      }).select('_id');
      
      const courseIds = enrolledCourses.map(course => course._id);
      
      assessments = await Assessment.find({
        course: { $in: courseIds },
        isActive: true,
        isPublished: true
      })
        .populate('course', 'title code')
        .populate('instructor', 'firstName lastName email')
        .sort({ scheduledDate: 1 });
    } else {
      // Admin can see all assessments
      assessments = await Assessment.find({ isActive: true })
        .populate('course', 'title code')
        .populate('instructor', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        assessments
      }
    });
  } catch (error) {
    console.error('Get my assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching assessments'
    });
  }
});

// @route   GET /api/assessments/upcoming
// @desc    Get upcoming assessments (student only)
// @access  Private (Student)
router.get('/upcoming', authenticate, authorize('student'), async (req, res) => {
  try {
    const enrolledCourses = await Course.find({
      'enrolledStudents.student': req.user._id,
      'enrolledStudents.status': 'active'
    }).select('_id');
    
    const courseIds = enrolledCourses.map(course => course._id);
    
    const upcomingAssessments = await Assessment.findUpcomingAssessments()
      .then(assessments => assessments.filter(assessment => 
        courseIds.some(courseId => courseId.toString() === assessment.course._id.toString())
      ));

    res.json({
      success: true,
      data: {
        assessments: upcomingAssessments
      }
    });
  } catch (error) {
    console.error('Get upcoming assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming assessments'
    });
  }
});

module.exports = router;
