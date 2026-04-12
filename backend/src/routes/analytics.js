const express = require('express');
const Analytics = require('../models/Analytics');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAnalyticsQuery } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics for current user
// @access  Private
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const dashboardAnalytics = await Analytics.getDashboardAnalytics(req.user._id, req.user.role);

    res.json({
      success: true,
      data: {
        analytics: dashboardAnalytics
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/user/:userId
// @desc    Get analytics for specific user
// @access  Private (Admin, Trainer for their students, User for themselves)
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'performance', courseId } = req.query;

    // Check permissions
    if (req.user.role === 'student' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students can only view their own analytics.'
      });
    }

    let analytics;
    if (courseId) {
      analytics = await Analytics.getUserAnalytics(userId, courseId, type);
    } else {
      // Get all analytics for the user
      analytics = await Analytics.find({
        user: userId,
        type: type
      }).populate('course', 'title code')
        .sort({ updatedAt: -1 });
    }

    res.json({
      success: true,
      data: {
        analytics
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user analytics'
    });
  }
});

// @route   GET /api/analytics/course/:courseId
// @desc    Get analytics for specific course
// @access  Private (Admin, Trainer for their courses)
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { type = 'performance' } = req.query;

    // Check permissions (simplified - in production, you'd verify course ownership)
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot view course analytics.'
      });
    }

    const analytics = await Analytics.getCourseAnalytics(courseId, type);

    res.json({
      success: true,
      data: {
        analytics
      }
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course analytics'
    });
  }
});

// @route   POST /api/analytics/generate/performance
// @desc    Generate performance analytics
// @access  Private (Admin, Trainer for their students)
router.post('/generate/performance', authenticate, async (req, res) => {
  try {
    const { userId, courseId, period } = req.body;

    if (!userId || !courseId || !period) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Course ID, and period are required'
      });
    }

    // Check permissions
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    const analytics = await Analytics.generatePerformanceAnalytics(userId, courseId, period);

    res.json({
      success: true,
      message: 'Performance analytics generated successfully',
      data: {
        analytics
      }
    });
  } catch (error) {
    console.error('Generate performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating performance analytics'
    });
  }
});

// @route   POST /api/analytics/generate/attendance
// @desc    Generate attendance analytics
// @access  Private (Admin, Trainer for their students)
router.post('/generate/attendance', authenticate, async (req, res) => {
  try {
    const { userId, courseId, period } = req.body;

    if (!userId || !courseId || !period) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Course ID, and period are required'
      });
    }

    // Check permissions
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    const analytics = await Analytics.generateAttendanceAnalytics(userId, courseId, period);

    res.json({
      success: true,
      message: 'Attendance analytics generated successfully',
      data: {
        analytics
      }
    });
  } catch (error) {
    console.error('Generate attendance analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating attendance analytics'
    });
  }
});

// @route   POST /api/analytics/generate/engagement
// @desc    Generate engagement analytics
// @access  Private (Admin, Trainer for their students)
router.post('/generate/engagement', authenticate, async (req, res) => {
  try {
    const { userId, courseId, period } = req.body;

    if (!userId || !courseId || !period) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Course ID, and period are required'
      });
    }

    // Check permissions
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    const analytics = await Analytics.generateEngagementAnalytics(userId, courseId, period);

    res.json({
      success: true,
      message: 'Engagement analytics generated successfully',
      data: {
        analytics
      }
    });
  } catch (error) {
    console.error('Generate engagement analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating engagement analytics'
    });
  }
});

// @route   POST /api/analytics/generate/progress
// @desc    Generate progress analytics
// @access  Private (Admin, Trainer for their students)
router.post('/generate/progress', authenticate, async (req, res) => {
  try {
    const { userId, courseId, period } = req.body;

    if (!userId || !courseId || !period) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Course ID, and period are required'
      });
    }

    // Check permissions
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    const analytics = await Analytics.generateProgressAnalytics(userId, courseId, period);

    res.json({
      success: true,
      message: 'Progress analytics generated successfully',
      data: {
        analytics
      }
    });
  } catch (error) {
    console.error('Generate progress analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating progress analytics'
    });
  }
});

// @route   GET /api/analytics/reports/performance
// @desc    Generate performance report
// @access  Private (Admin, Trainer for their courses, Student for themselves)
router.get('/reports/performance', authenticate, async (req, res) => {
  try {
    const { courseId, userId, format = 'json', startDate, endDate } = req.query;

    // Build period object
    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: endDate ? new Date(endDate) : new Date()
    };

    let analyticsData;

    if (req.user.role === 'student') {
      // Students can only get their own reports
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required for student reports'
        });
      }
      analyticsData = await Analytics.getUserAnalytics(req.user._id, courseId, 'performance');
    } else if (req.user.role === 'trainer') {
      // Trainers can get reports for their courses
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required for trainer reports'
        });
      }
      analyticsData = await Analytics.getCourseAnalytics(courseId, 'performance');
    } else {
      // Admins can get any reports
      if (userId) {
        analyticsData = await Analytics.getUserAnalytics(userId, courseId, 'performance');
      } else if (courseId) {
        analyticsData = await Analytics.getCourseAnalytics(courseId, 'performance');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either User ID or Course ID is required'
        });
      }
    }

    if (analyticsData === null || analyticsData === undefined) {
      return res.status(404).json({
        success: false,
        message: 'No analytics data found for the selected filters. Try generating analytics first or pick another course.'
      });
    }

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = convertAnalyticsToCSV(analyticsData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=performance_report.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: {
          report: analyticsData,
          period,
          generatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Generate performance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating performance report'
    });
  }
});

// @route   GET /api/analytics/reports/attendance
// @desc    Generate attendance report
// @access  Private (Admin, Trainer for their courses)
router.get('/reports/attendance', authenticate, async (req, res) => {
  try {
    const { courseId, format = 'json', startDate, endDate } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Check permissions
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot access attendance reports.'
      });
    }

    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date()
    };

    const analyticsData = await Analytics.getCourseAnalytics(courseId, 'attendance');

    if (format === 'csv') {
      const csv = convertAnalyticsToCSV(analyticsData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: {
          report: analyticsData,
          period,
          generatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Generate attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating attendance report'
    });
  }
});

// @route   GET /api/analytics/summary/:courseId
// @desc    Get course summary analytics
// @access  Private (Admin, Trainer for their courses)
router.get('/summary/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check permissions
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot access course summaries.'
      });
    }

    // Get all types of analytics for the course
    const performanceAnalytics = await Analytics.getCourseAnalytics(courseId, 'performance');
    const attendanceAnalytics = await Analytics.getCourseAnalytics(courseId, 'attendance');
    const engagementAnalytics = await Analytics.getCourseAnalytics(courseId, 'engagement');
    const progressAnalytics = await Analytics.getCourseAnalytics(courseId, 'progress');

    // Calculate summary statistics
    const summary = {
      performance: {
        averageScore: calculateAverage(performanceAnalytics, 'data.averageScore'),
        passRate: calculateAverage(performanceAnalytics, 'data.passRate'),
        totalAssessments: performanceAnalytics.reduce((sum, a) => sum + (a.data.completedAssessments || 0), 0)
      },
      attendance: {
        averageRate: calculateAverage(attendanceAnalytics, 'data.attendanceRate'),
        totalSessions: attendanceAnalytics.reduce((sum, a) => sum + (a.data.totalSessions || 0), 0)
      },
      engagement: {
        averageTimeSpent: calculateAverage(engagementAnalytics, 'data.timeSpent'),
        totalLogins: engagementAnalytics.reduce((sum, a) => sum + (a.data.loginFrequency || 0), 0)
      },
      progress: {
        averageProgress: calculateAverage(progressAnalytics, 'data.progressPercentage'),
        totalCompletedModules: progressAnalytics.reduce((sum, a) => sum + (a.data.completedModules || 0), 0)
      }
    };

    res.json({
      success: true,
      data: {
        summary,
        courseId,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Get course summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating course summary'
    });
  }
});

// Helper function to convert analytics to CSV
function convertAnalyticsToCSV(analyticsData) {
  if (!analyticsData || (Array.isArray(analyticsData) && analyticsData.length === 0)) {
    return 'No data available';
  }

  const data = Array.isArray(analyticsData) ? analyticsData : [analyticsData];
  
  let csv = 'User,Course,Type,Average Score,Pass Rate,Attendance Rate,Time Spent,Progress,Last Activity\n';
  
  data.forEach(item => {
    const user = item.user ? item.user.firstName + ' ' + item.user.lastName : 'Unknown';
    const course = item.course ? (item.course.title || item.course.code) : 'Unknown';
    const type = item.type || 'Unknown';
    const avgScore = item.data.averageScore || 0;
    const passRate = item.data.passRate || 0;
    const attendanceRate = item.data.attendanceRate || 0;
    const timeSpent = item.data.timeSpent || 0;
    const progress = item.data.progressPercentage || 0;
    const lastActivity = item.data.lastActivity ? new Date(item.data.lastActivity).toLocaleDateString() : 'N/A';
    
    csv += `"${user}","${course}","${type}",${avgScore},${passRate},${attendanceRate},${timeSpent},${progress},"${lastActivity}"\n`;
  });
  
  return csv;
}

// Helper function to calculate average from analytics array
function calculateAverage(analyticsArray, path) {
  if (!analyticsArray || analyticsArray.length === 0) return 0;
  
  const values = analyticsArray.map(item => {
    const pathParts = path.split('.');
    let value = item;
    for (const part of pathParts) {
      value = value && value[part];
    }
    return value || 0;
  });
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

module.exports = router;
