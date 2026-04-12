const express = require('express');
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAnalyticsQuery } = require('../middleware/validation');

const router = express.Router();

function coerceNumericDataPatch(patch) {
  if (!patch || typeof patch !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === '' || v == null) continue;
    const n = Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

async function applyOptionalDataPatch(analyticsDoc, dataPatch) {
  const patch = coerceNumericDataPatch(dataPatch);
  if (!Object.keys(patch).length) return analyticsDoc;
  const plain = analyticsDoc.toObject ? analyticsDoc.toObject() : analyticsDoc;
  const merged = { ...(plain.data || {}), ...patch };
  analyticsDoc.set('data', merged);
  analyticsDoc.markModified('data');
  await analyticsDoc.save();
  return analyticsDoc;
}

function validateGenerateBody(body) {
  const { userId, courseId, period } = body;
  if (!userId || !courseId || !period) {
    return 'User ID, Course ID, and period are required';
  }
  if (period.start == null || period.end == null) {
    return 'period.start and period.end are required';
  }
  return null;
}

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

router.get('/records', authenticate, async (req, res) => {
  try {
    const { type, courseId, limit = 100 } = req.query;
    const lim = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);

    const query = {};
    if (type) query.type = type;
    if (courseId) query.course = courseId;

    if (req.user.role === 'student') {
      query.user = req.user._id;
      if (courseId) {
        const course = await Course.findById(courseId).select('enrolledStudents');
        if (!course) {
          return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const uid = req.user._id.toString();
        const enrolled = (course.enrolledStudents || []).some((e) => {
          const sid = (e.student && e.student._id ? e.student._id : e.student)?.toString?.();
          return sid === uid && (!e.status || e.status === 'active');
        });
        if (!enrolled) {
          return res.status(403).json({
            success: false,
            message: 'You are not enrolled in this course.',
          });
        }
      }
    } else if (req.user.role === 'trainer') {
      const myCourses = await Course.find({ instructor: req.user._id }).select('_id');
      const ids = myCourses.map((c) => c._id);
      if (!ids.length) {
        return res.json({
          success: true,
          data: { analytics: [] },
        });
      }
      if (courseId) {
        const allowed = ids.some((id) => id.toString() === courseId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: 'You can only view analytics for courses you instruct.',
          });
        }
        query.course = courseId;
      } else {
        query.course = { $in: ids };
      }
    }

    const analytics = await Analytics.find(query)
      .populate('user', 'firstName lastName email role')
      .populate('course', 'title code')
      .sort({ updatedAt: -1 })
      .limit(lim);

    res.json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    console.error('List analytics records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while listing analytics',
    });
  }
});

router.get('/record/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid analytics id' });
    }

    const doc = await Analytics.findById(id)
      .populate('user', 'firstName lastName email role')
      .populate('course', 'title code instructor')
      .populate('course.instructor', 'firstName lastName email');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Analytics not found' });
    }

    if (req.user.role === 'student') {
      if (doc.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own analytics.',
        });
      }
    } else if (req.user.role === 'trainer') {
      const instructorId = doc.course?.instructor?._id || doc.course?.instructor;
      if (!instructorId || instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view analytics for courses you instruct.',
        });
      }
    }

    res.json({
      success: true,
      data: { analytics: doc },
    });
  } catch (error) {
    console.error('Get analytics record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
    });
  }
});

router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'performance', courseId } = req.query;

    
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

router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { type = 'performance' } = req.query;

    
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

router.post('/generate/performance', authenticate, async (req, res) => {
  try {
    const msg = validateGenerateBody(req.body);
    if (msg) {
      return res.status(400).json({ success: false, message: msg });
    }
    const { userId, courseId, period, data: inputData } = req.body;

    
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    let analytics = await Analytics.generatePerformanceAnalytics(userId, courseId, period);
    analytics = await applyOptionalDataPatch(analytics, inputData);

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

router.post('/generate/attendance', authenticate, async (req, res) => {
  try {
    const msg = validateGenerateBody(req.body);
    if (msg) {
      return res.status(400).json({ success: false, message: msg });
    }
    const { userId, courseId, period, data: inputData } = req.body;

    
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    let analytics = await Analytics.generateAttendanceAnalytics(userId, courseId, period);
    analytics = await applyOptionalDataPatch(analytics, inputData);

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

router.post('/generate/engagement', authenticate, async (req, res) => {
  try {
    const msg = validateGenerateBody(req.body);
    if (msg) {
      return res.status(400).json({ success: false, message: msg });
    }
    const { userId, courseId, period, data: inputData } = req.body;

    
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    let analytics = await Analytics.generateEngagementAnalytics(userId, courseId, period);
    analytics = await applyOptionalDataPatch(analytics, inputData);

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

router.post('/generate/progress', authenticate, async (req, res) => {
  try {
    const msg = validateGenerateBody(req.body);
    if (msg) {
      return res.status(400).json({ success: false, message: msg });
    }
    const { userId, courseId, period, data: inputData } = req.body;

    
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot generate analytics.'
      });
    }

    let analytics = await Analytics.generateProgressAnalytics(userId, courseId, period);
    analytics = await applyOptionalDataPatch(analytics, inputData);

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

router.get('/reports/performance', authenticate, async (req, res) => {
  try {
    const { courseId, userId, format = 'json', startDate, endDate } = req.query;

    
    const period = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
      end: endDate ? new Date(endDate) : new Date()
    };

    let analyticsData;

    if (req.user.role === 'student') {
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required for student reports'
        });
      }
      analyticsData = await Analytics.getUserAnalytics(req.user._id, courseId, 'performance');
    } else if (req.user.role === 'trainer') {
      
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required for trainer reports'
        });
      }
      analyticsData = await Analytics.getCourseAnalytics(courseId, 'performance');
    } else {
      
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

router.get('/reports/attendance', authenticate, async (req, res) => {
  try {
    const { courseId, format = 'json', startDate, endDate } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    
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

router.get('/summary/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot access course summaries.'
      });
    }

    
    const performanceAnalytics = await Analytics.getCourseAnalytics(courseId, 'performance');
    const attendanceAnalytics = await Analytics.getCourseAnalytics(courseId, 'attendance');
    const engagementAnalytics = await Analytics.getCourseAnalytics(courseId, 'engagement');
    const progressAnalytics = await Analytics.getCourseAnalytics(courseId, 'progress');

    
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
