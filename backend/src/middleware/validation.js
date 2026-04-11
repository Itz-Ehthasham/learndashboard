const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('role')
    .optional()
    .isIn(['admin', 'trainer', 'student'])
    .withMessage('Role must be admin, trainer, or student'),
    
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('dateOfBirth')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
    
  validate
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  validate
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('dateOfBirth')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
    
  body('role')
    .optional()
    .isIn(['admin', 'trainer', 'student'])
    .withMessage('Role must be admin, trainer, or student'),
    
  validate
];

// Course validation rules
const validateCourseCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 100 })
    .withMessage('Course title cannot exceed 100 characters'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ max: 1000 })
    .withMessage('Course description cannot exceed 1000 characters'),
    
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Course code is required')
    .matches(/^[A-Z]{2,4}\d{3,4}$/)
    .withMessage('Course code must be in format like CS101 or MATH2001'),
    
  body('instructor')
    .isMongoId()
    .withMessage('Valid instructor ID is required'),
    
  body('category')
    .isIn(['Computer Science', 'Mathematics', 'Science', 'Engineering', 'Business', 'Arts', 'Language', 'Other'])
    .withMessage('Please select a valid category'),
    
  body('level')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Please select a valid level'),
    
  body('credits')
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
    
  body('duration')
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),
    
  body('maxStudents')
    .isInt({ min: 1, max: 500 })
    .withMessage('Maximum students must be between 1 and 500'),
    
  body('schedule.startDate')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
    
  body('schedule.endDate')
    .isISO8601()
    .withMessage('Please provide a valid end date'),
    
  body('schedule.startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
    
  body('schedule.endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
    
  validate
];

const validateCourseUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Course title cannot exceed 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course description cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Course description cannot exceed 1000 characters'),
    
  body('category')
    .optional()
    .isIn(['Computer Science', 'Mathematics', 'Science', 'Engineering', 'Business', 'Arts', 'Language', 'Other'])
    .withMessage('Please select a valid category'),
    
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Please select a valid level'),
    
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
    
  body('duration')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Duration must be between 1 and 52 weeks'),
    
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Maximum students must be between 1 and 500'),
    
  validate
];

// Assessment validation rules
const validateAssessmentCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Assessment title is required')
    .isLength({ max: 100 })
    .withMessage('Assessment title cannot exceed 100 characters'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Assessment description is required')
    .isLength({ max: 1000 })
    .withMessage('Assessment description cannot exceed 1000 characters'),
    
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
    
  body('type')
    .isIn(['quiz', 'exam', 'assignment', 'project', 'presentation', 'lab'])
    .withMessage('Please select a valid assessment type'),
    
  body('maxScore')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum score must be between 1 and 1000'),
    
  body('passingScore')
    .isInt({ min: 0, max: 1000 })
    .withMessage('Passing score must be between 0 and 1000'),
    
  body('duration')
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
    
  body('scheduledDate')
    .isISO8601()
    .withMessage('Please provide a valid scheduled date'),
    
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
    
  body('instructions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Instructions cannot exceed 2000 characters'),
    
  validate
];

const validateAssessmentUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assessment title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Assessment title cannot exceed 100 characters'),
    
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assessment description cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Assessment description cannot exceed 1000 characters'),
    
  body('maxScore')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum score must be between 1 and 1000'),
    
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Passing score must be between 0 and 1000'),
    
  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
    
  validate
];

// Analytics validation rules
const validateAnalyticsQuery = [
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Valid user ID is required'),
    
  body('courseId')
    .optional()
    .isMongoId()
    .withMessage('Valid course ID is required'),
    
  body('type')
    .optional()
    .isIn(['performance', 'attendance', 'engagement', 'progress'])
    .withMessage('Type must be performance, attendance, engagement, or progress'),
    
  body('period.start')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
    
  body('period.end')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
    
  validate
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
    
  validate
];

// Email validation for password reset
const validateEmailRequest = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  validate
];

// Password reset validation
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  validate
];

module.exports = {
  validate,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateCourseCreation,
  validateCourseUpdate,
  validateAssessmentCreation,
  validateAssessmentUpdate,
  validateAnalyticsQuery,
  validatePasswordChange,
  validateEmailRequest,
  validatePasswordReset
};
