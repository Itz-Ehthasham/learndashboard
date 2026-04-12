const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{2,4}\d{3,4}$/, 'Course code must be in format like CS101 or MATH2001']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['Computer Science', 'Mathematics', 'Science', 'Engineering', 'Business', 'Arts', 'Language', 'Health', 'Other']
  },
  branch: {
    type: String,
    required: [true, 'Engineering branch is required'],
    enum: [
      'CSE', 'CSM', 'EEE', 'ECE', 'EIE', 'MECH', 'CHEM', 'CIVIL',
      'CSC', 'DS', 'AI', 'AIML', 'IT', 'CSD', 'CYBER',
      'BTech', 'MTech', 'BSc', 'MSc', 'PhD', 'Other'
    ]
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  credits: {
    type: Number,
    required: [true, 'Course credits are required'],
    min: [1, 'Course credits must be at least 1'],
    max: [10, 'Course credits cannot exceed 10']
  },
  duration: {
    type: Number,
    required: [true, 'Course duration in weeks is required'],
    min: [1, 'Course duration must be at least 1 week'],
    max: [52, 'Course duration cannot exceed 52 weeks']
  },
  maxStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Maximum students must be at least 1'],
    max: [500, 'Maximum students cannot exceed 500']
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active'
    }
  }],
  schedule: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    daysOfWeek: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    }
  },
  materials: [{
    name: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'assignment']
    },
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  createdAt: {
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

courseSchema.index({ code: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isActive: 1 });

courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

courseSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.filter(enrollment => enrollment.status === 'active').length;
});

courseSchema.virtual('availableSpots').get(function() {
  return this.maxStudents - this.enrolledCount;
});

courseSchema.virtual('isFull').get(function() {
  return this.availableSpots <= 0;
});

courseSchema.methods.enrollStudent = function(studentId) {
  
  const existingEnrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (existingEnrollment) {
    throw new Error('Student is already enrolled in this course');
  }
  
  
  if (this.isFull) {
    throw new Error('Course is full');
  }
  
  
  this.enrolledStudents.push({
    student: studentId,
    enrollmentDate: new Date(),
    status: 'active'
  });
  
  return this.save();
};

courseSchema.methods.unenrollStudent = function(studentId) {
  const enrollmentIndex = this.enrolledStudents.findIndex(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (enrollmentIndex === -1) {
    throw new Error('Student is not enrolled in this course');
  }
  
  this.enrolledStudents[enrollmentIndex].status = 'dropped';
  return this.save();
};

courseSchema.statics.findActiveCourses = function() {
  return this.find({ isActive: true }).populate('instructor', 'firstName lastName email');
};

courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId, isActive: true })
    .populate('instructor', 'firstName lastName email')
    .populate('enrolledStudents.student', 'firstName lastName email');
};

courseSchema.statics.findAvailableCourses = function() {
  return this.find({ isActive: true })
    .populate('instructor', 'firstName lastName email')
    .then(courses => courses.filter(course => !course.isFull));
};

courseSchema.methods.toJSON = function() {
  const courseObject = this.toObject();
  delete courseObject.__v;
  return courseObject;
};

module.exports = mongoose.model('Course', courseSchema);
