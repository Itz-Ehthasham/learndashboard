const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); 
    
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    
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

const checkResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const resourceId = req.params.id;
      
      switch (resourceType) {
        case 'user':
          
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
          
          
          if (user.role === 'admin') {
            return next();
          }
          
          
          if (user.role === 'trainer' && course.instructor.toString() === user._id.toString()) {
            return next();
          }
          
          
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
          
          
          if (user.role === 'admin') {
            return next();
          }
          
          
          if (user.role === 'trainer' && assessment.course.instructor.toString() === user._id.toString()) {
            return next();
          }
          
          
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
    
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  checkResourceAccess,
  optionalAuth
};
