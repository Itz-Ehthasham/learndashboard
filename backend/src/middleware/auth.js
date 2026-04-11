const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate user using JWT
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Middleware to authorize based on user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Middleware to check if user can access specific resource
const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resourceId = req.params.id;
      
      switch (resourceType) {
        case 'user':
          // Users can only access their own profile unless they're admin
          if (user.role !== 'admin' && user._id.toString() !== resourceId) {
            return res.status(403).json({
              success: false,
              message: 'Access denied. You can only access your own profile.'
            });
          }
          break;
          
        case 'course':
          const Course = require('../models/Course');
          const course = await Course.findById(resourceId);
          
          if (!course) {
            return res.status(404).json({
              success: false,
              message: 'Course not found.'
            });
          }
          
          // Admin can access all courses
          if (user.role === 'admin') {
            return next();
          }
          
          // Instructor can access their own courses
          if (user.role === 'trainer' && course.instructor.toString() === user._id.toString()) {
            return next();
          }
          
          // Students can only access courses they're enrolled in
          if (user.role === 'student') {
            const isEnrolled = course.enrolledStudents.some(
              enrollment => enrollment.student.toString() === user._id.toString() && 
                           enrollment.status === 'active'
            );
            
            if (!isEnrolled) {
              return res.status(403).json({
                success: false,
                message: 'Access denied. You are not enrolled in this course.'
              });
            }
          } else {
            return res.status(403).json({
              success: false,
              message: 'Access denied. Insufficient permissions.'
            });
          }
          break;
          
        case 'assessment':
          const Assessment = require('../models/Assessment');
          const assessment = await Assessment.findById(resourceId).populate('course');
          
          if (!assessment) {
            return res.status(404).json({
              success: false,
              message: 'Assessment not found.'
            });
          }
          
          // Admin can access all assessments
          if (user.role === 'admin') {
            return next();
          }
          
          // Instructor can access assessments for their courses
          if (user.role === 'trainer' && assessment.course.instructor.toString() === user._id.toString()) {
            return next();
          }
          
          // Students can only access assessments for courses they're enrolled in
          if (user.role === 'student') {
            const isEnrolled = assessment.course.enrolledStudents.some(
              enrollment => enrollment.student.toString() === user._id.toString() && 
                           enrollment.status === 'active'
            );
            
            if (!isEnrolled) {
              return res.status(403).json({
                success: false,
                message: 'Access denied. You are not enrolled in this course.'
              });
            }
          } else {
            return res.status(403).json({
              success: false,
              message: 'Access denied. Insufficient permissions.'
            });
          }
          break;
          
        case 'analytics':
          // Analytics access depends on user role and context
          // This will be handled in the specific analytics routes
          break;
          
        default:
          return res.status(403).json({
            success: false,
            message: 'Access denied. Invalid resource type.'
          });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error during authorization check.'
      });
    }
  };
};

// Middleware to optionally authenticate (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  checkResourceAccess,
  optionalAuth
};
