const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  type: {
    type: String,
    enum: ['performance', 'attendance', 'engagement', 'progress'],
    required: true
  },
  data: {
    // Performance data
    averageScore: {
      type: Number,
      min: 0,
      max: 100
    },
    totalAssessments: {
      type: Number,
      min: 0
    },
    completedAssessments: {
      type: Number,
      min: 0
    },
    passRate: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Attendance data
    totalSessions: {
      type: Number,
      min: 0
    },
    attendedSessions: {
      type: Number,
      min: 0
    },
    attendanceRate: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Engagement data
    loginFrequency: {
      type: Number,
      min: 0
    },
    timeSpent: {
      type: Number, // in minutes
      min: 0
    },
    resourceAccessCount: {
      type: Number,
      min: 0
    },
    forumParticipation: {
      type: Number,
      min: 0
    },
    
    // Progress data
    completedModules: {
      type: Number,
      min: 0
    },
    totalModules: {
      type: Number,
      min: 0
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Additional metrics
    lastActivity: {
      type: Date
    },
    streakDays: {
      type: Number,
      min: 0
    },
    improvementRate: {
      type: Number
    }
  },
  trends: [{
    date: {
      type: Date,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    metric: {
      type: String,
      required: true
    }
  }],
  comparisons: {
    classAverage: {
      type: Number
    },
    percentile: {
      type: Number,
      min: 0,
      max: 100
    },
    rank: {
      type: Number,
      min: 1
    },
    totalStudents: {
      type: Number,
      min: 1
    }
  },
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
analyticsSchema.index({ user: 1, course: 1 });
analyticsSchema.index({ type: 1 });
analyticsSchema.index({ period: 1 });
analyticsSchema.index({ generatedAt: 1 });

// Pre-save middleware to update updatedAt
analyticsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get user analytics for a course
analyticsSchema.statics.getUserAnalytics = function(userId, courseId, type = 'performance') {
  return this.findOne({
    user: userId,
    course: courseId,
    type: type
  }).populate('user', 'firstName lastName email')
    .populate('course', 'title code');
};

// Static method to get course analytics
analyticsSchema.statics.getCourseAnalytics = function(courseId, type = 'performance') {
  return this.find({
    course: courseId,
    type: type
  }).populate('user', 'firstName lastName email')
    .sort({ 'data.averageScore': -1 });
};

// Static method to generate performance analytics
analyticsSchema.statics.generatePerformanceAnalytics = async function(userId, courseId, period) {
  const User = mongoose.model('User');
  const Course = mongoose.model('Course');
  const Assessment = mongoose.model('Assessment');
  
  // Get user and course
  const user = await User.findById(userId);
  const course = await Course.findById(courseId);
  
  if (!user || !course) {
    throw new Error('User or course not found');
  }
  
  // Get assessments for the course
  const assessments = await Assessment.find({
    course: courseId,
    'submissions.student': userId,
    'submissions.status': 'submitted'
  });
  
  // Calculate performance metrics
  let totalScore = 0;
  let completedAssessments = 0;
  let passedAssessments = 0;
  
  assessments.forEach(assessment => {
    const submission = assessment.submissions.find(sub => sub.student.toString() === userId.toString());
    if (submission) {
      totalScore += submission.score;
      completedAssessments++;
      if (submission.passed) {
        passedAssessments++;
      }
    }
  });
  
  const averageScore = completedAssessments > 0 ? totalScore / completedAssessments : 0;
  const passRate = completedAssessments > 0 ? (passedAssessments / completedAssessments) * 100 : 0;
  
  // Get class average for comparison
  const allCourseAnalytics = await this.find({
    course: courseId,
    type: 'performance'
  });
  
  const classAverage = allCourseAnalytics.length > 0 
    ? allCourseAnalytics.reduce((sum, analytics) => sum + (analytics.data.averageScore || 0), 0) / allCourseAnalytics.length
    : 0;
  
  // Calculate percentile and rank
  const sortedScores = allCourseAnalytics.map(a => a.data.averageScore || 0).sort((a, b) => b - a);
  const rank = sortedScores.indexOf(averageScore) + 1;
  const percentile = sortedScores.length > 0 ? ((sortedScores.length - rank) / sortedScores.length) * 100 : 0;
  
  // Create or update analytics
  const analytics = await this.findOneAndUpdate(
    {
      user: userId,
      course: courseId,
      type: 'performance',
      period: period
    },
    {
      $set: {
        data: {
          averageScore,
          totalAssessments: assessments.length,
          completedAssessments,
          passRate,
          lastActivity: new Date()
        },
        comparisons: {
          classAverage,
          percentile,
          rank,
          totalStudents: allCourseAnalytics.length
        }
      }
    },
    { upsert: true, new: true }
  );
  
  return analytics;
};

// Static method to generate attendance analytics
analyticsSchema.statics.generateAttendanceAnalytics = async function(userId, courseId, period) {
  // This would typically integrate with an attendance system
  // For now, we'll generate sample data
  
  const attendanceData = {
    totalSessions: 30,
    attendedSessions: 27,
    attendanceRate: 90,
    lastActivity: new Date()
  };
  
  const analytics = await this.findOneAndUpdate(
    {
      user: userId,
      course: courseId,
      type: 'attendance',
      period: period
    },
    {
      $set: {
        data: attendanceData
      }
    },
    { upsert: true, new: true }
  );
  
  return analytics;
};

// Static method to generate engagement analytics
analyticsSchema.statics.generateEngagementAnalytics = async function(userId, courseId, period) {
  // This would typically track user interactions
  // For now, we'll generate sample data
  
  const engagementData = {
    loginFrequency: 15, // times per week
    timeSpent: 180, // minutes per week
    resourceAccessCount: 45,
    forumParticipation: 8,
    lastActivity: new Date(),
    streakDays: 5
  };
  
  const analytics = await this.findOneAndUpdate(
    {
      user: userId,
      course: courseId,
      type: 'engagement',
      period: period
    },
    {
      $set: {
        data: engagementData
      }
    },
    { upsert: true, new: true }
  );
  
  return analytics;
};

// Static method to generate progress analytics
analyticsSchema.statics.generateProgressAnalytics = async function(userId, courseId, period) {
  // This would typically track module completion
  // For now, we'll generate sample data
  
  const progressData = {
    completedModules: 8,
    totalModules: 10,
    progressPercentage: 80,
    lastActivity: new Date(),
    improvementRate: 12.5
  };
  
  const analytics = await this.findOneAndUpdate(
    {
      user: userId,
      course: courseId,
      type: 'progress',
      period: period
    },
    {
      $set: {
        data: progressData
      }
    },
    { upsert: true, new: true }
  );
  
  return analytics;
};

// Static method to get dashboard analytics
analyticsSchema.statics.getDashboardAnalytics = async function(userId, userRole) {
  const User = mongoose.model('User');
  const Course = mongoose.model('Course');
  const Assessment = mongoose.model('Assessment');
  
  let analytics = {};
  
  if (userRole === 'student') {
    // Student dashboard analytics
    const enrolledCourses = await Course.find({
      'enrolledStudents.student': userId,
      isActive: true
    });
    
    const courseIds = enrolledCourses.map(course => course._id);
    
    // Get performance analytics for all courses
    const performanceAnalytics = await this.find({
      user: userId,
      course: { $in: courseIds },
      type: 'performance'
    });
    
    // Calculate overall metrics
    const overallAverage = performanceAnalytics.length > 0
      ? performanceAnalytics.reduce((sum, a) => sum + (a.data?.averageScore ?? 0), 0) / performanceAnalytics.length
      : 0;
    
    const totalAssessments = performanceAnalytics.reduce((sum, a) => sum + (a.data?.completedAssessments ?? 0), 0);
    
    analytics = {
      overallAverage,
      totalAssessments,
      enrolledCourses: enrolledCourses.length,
      recentActivity: new Date()
    };
    
  } else if (userRole === 'trainer') {
    // Trainer dashboard analytics
    const instructorCourses = await Course.find({
      instructor: userId,
      isActive: true
    });
    
    const courseIds = instructorCourses.map(course => course._id);
    
    // Get all students in instructor's courses
    const allStudents = await Course.aggregate([
      { $match: { instructor: userId, isActive: true } },
      { $unwind: '$enrolledStudents' },
      { $match: { 'enrolledStudents.status': 'active' } },
      { $group: { _id: null, totalStudents: { $sum: 1 } } }
    ]);
    
    // Get course analytics
    const courseAnalytics = await this.find({
      course: { $in: courseIds },
      type: 'performance'
    });
    
    const classAverage = courseAnalytics.length > 0
      ? courseAnalytics.reduce((sum, a) => sum + (a.data?.averageScore ?? 0), 0) / courseAnalytics.length
      : 0;
    
    analytics = {
      totalCourses: instructorCourses.length,
      totalStudents: allStudents[0]?.totalStudents || 0,
      classAverage,
      pendingGrades: 0,
      recentActivity: new Date()
    };
    
  } else if (userRole === 'admin') {
    // Admin dashboard analytics
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalAssessments = await Assessment.countDocuments({ isActive: true });
    
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    analytics = {
      totalUsers,
      totalCourses,
      totalAssessments,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity: new Date()
    };
  }
  
  return analytics;
};

// Instance method to add trend data
analyticsSchema.methods.addTrend = function(date, value, metric) {
  this.trends.push({ date, value, metric });
  return this.save();
};

// To JSON transformation
analyticsSchema.methods.toJSON = function() {
  const analyticsObject = this.toObject();
  delete analyticsObject.__v;
  return analyticsObject;
};

module.exports = mongoose.model('Analytics', analyticsSchema);
