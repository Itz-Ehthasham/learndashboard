const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present',
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });
attendanceRecordSchema.index({ course: 1, date: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
