const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');

function countsAsAttended(status) {
  return status === 'present' || status === 'late' || status === 'excused';
}

async function syncStudentAttendanceSummary(studentId) {
  const records = await AttendanceRecord.find({ student: studentId });
  const totalSessions = records.length;
  const attendedSessions = records.filter((r) => countsAsAttended(r.status)).length;
  const attendanceRate =
    totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 1000) / 10 : 0;

  await User.updateOne(
    { _id: studentId },
    {
      $set: {
        'attendance.totalSessions': totalSessions,
        'attendance.attendedSessions': attendedSessions,
        'attendance.attendanceRate': attendanceRate,
      },
    }
  );
}

module.exports = {
  syncStudentAttendanceSummary,
  countsAsAttended,
};
