const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const AttendanceRecord = require('../models/AttendanceRecord');
const { authenticate, authorize } = require('../middleware/auth');
const { syncStudentAttendanceSummary } = require('../utils/attendanceRollup');

const router = express.Router();

function parseDayUtc(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function canManageCourse(user, course) {
  if (!course) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'trainer' && course.instructor.toString() === user._id.toString()) return true;
  return false;
}

router.get('/day', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const { courseId, date } = req.query;
    if (!courseId || !date) {
      return res.status(400).json({
        success: false,
        message: 'courseId and date (YYYY-MM-DD) are required',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid courseId' });
    }
    const day = parseDayUtc(date);
    if (!day || Number.isNaN(day.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const course = await Course.findById(courseId).populate(
      'enrolledStudents.student',
      'firstName lastName email studentId role'
    );

    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({
        success: false,
        message: 'You can only record attendance for courses you instruct.',
      });
    }

    const records = await AttendanceRecord.find({ course: courseId, date: day });
    const byStudent = new Map(records.map((r) => [r.student.toString(), r]));

    const activeEnrolled = (course.enrolledStudents || []).filter((e) => e.status === 'active');
    const students = activeEnrolled
      .map((e) => {
        const st = e.student;
        if (!st || st.role !== 'student') return null;
        const rec = byStudent.get(st._id.toString());
        return {
          student: {
            _id: st._id,
            firstName: st.firstName,
            lastName: st.lastName,
            email: st.email,
            studentId: st.studentId,
          },
          status: rec ? rec.status : 'present',
          recordId: rec ? rec._id : null,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          code: course.code,
        },
        date: date,
        students,
      },
    });
  } catch (error) {
    console.error('Get attendance day error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while loading attendance',
    });
  }
});

router.post('/day/bulk', authenticate, authorize('admin', 'trainer'), async (req, res) => {
  try {
    const { courseId, date, entries } = req.body;

    if (!courseId || !date || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        message: 'courseId, date (YYYY-MM-DD), and entries[] are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid courseId' });
    }

    const day = parseDayUtc(date);
    if (!day || Number.isNaN(day.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const allowed = new Set(['present', 'absent', 'late', 'excused']);
    const course = await Course.findById(courseId);

    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (!canManageCourse(req.user, course)) {
      return res.status(403).json({
        success: false,
        message: 'You can only record attendance for courses you instruct.',
      });
    }

    const activeIds = new Set(
      (course.enrolledStudents || [])
        .filter((e) => e.status === 'active')
        .map((e) => e.student.toString())
    );

    const affected = new Set();

    for (const row of entries) {
      const studentId = row.studentId;
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) continue;
      if (!activeIds.has(studentId)) continue;

      const status = row.status || 'present';
      if (!allowed.has(status)) continue;

      await AttendanceRecord.findOneAndUpdate(
        { student: studentId, course: courseId, date: day },
        {
          student: studentId,
          course: courseId,
          date: day,
          status,
          recordedBy: req.user._id,
          ...(row.notes ? { notes: String(row.notes).slice(0, 500) } : {}),
        },
        { upsert: true, new: true, runValidators: true }
      );
      affected.add(studentId);
    }

    await Promise.all([...affected].map((id) => syncStudentAttendanceSummary(id)));

    res.json({
      success: true,
      message: 'Attendance saved',
      data: { updatedStudents: affected.size },
    });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving attendance',
    });
  }
});

module.exports = router;
