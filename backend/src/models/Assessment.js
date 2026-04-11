const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true,
    maxlength: [100, 'Assessment title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Assessment description is required'],
    maxlength: [1000, 'Assessment description cannot exceed 1000 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: [true, 'Assessment type is required'],
    enum: ['quiz', 'exam', 'assignment', 'project', 'presentation', 'lab']
  },
  maxScore: {
    type: Number,
    required: [true, 'Maximum score is required'],
    min: [1, 'Maximum score must be at least 1'],
    max: [1000, 'Maximum score cannot exceed 1000']
  },
  passingScore: {
    type: Number,
    required: [true, 'Passing score is required'],
    min: [0, 'Passing score cannot be negative'],
    max: [1000, 'Passing score cannot exceed 1000']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 480 minutes (8 hours)']
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'fill-blank'],
      required: true
    },
    options: [String], // for multiple-choice questions
    correctAnswer: String,
    points: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    answers: [{
      questionIndex: Number,
      answer: String,
      isCorrect: Boolean
    }],
    score: {
      type: Number,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    passed: {
      type: Boolean,
      default: false
    },
    timeSpent: {
      type: Number, // in minutes
      min: 0
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'submitted', 'graded'],
      default: 'not-started'
    },
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  allowMultipleAttempts: {
    type: Boolean,
    default: false
  },
  maxAttempts: {
    type: Number,
    min: 1,
    default: 1
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: false
  },
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

// Indexes for efficient queries
assessmentSchema.index({ course: 1 });
assessmentSchema.index({ instructor: 1 });
assessmentSchema.index({ type: 1 });
assessmentSchema.index({ scheduledDate: 1 });
assessmentSchema.index({ dueDate: 1 });
assessmentSchema.index({ isActive: 1 });
assessmentSchema.index({ isPublished: 1 });

// Pre-save middleware to update updatedAt
assessmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total questions
assessmentSchema.virtual('totalQuestions').get(function() {
  return this.questions.length;
});

// Virtual for total points
assessmentSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, question) => sum + question.points, 0);
});

// Virtual for submission count
assessmentSchema.virtual('submissionCount').get(function() {
  return this.submissions.filter(sub => sub.status === 'submitted').length;
});

// Virtual for average score
assessmentSchema.virtual('averageScore').get(function() {
  const submittedSubmissions = this.submissions.filter(sub => sub.status === 'submitted' && sub.score !== undefined);
  if (submittedSubmissions.length === 0) return 0;
  const totalScore = submittedSubmissions.reduce((sum, sub) => sum + sub.score, 0);
  return totalScore / submittedSubmissions.length;
});

// Virtual for pass rate
assessmentSchema.virtual('passRate').get(function() {
  const submittedSubmissions = this.submissions.filter(sub => sub.status === 'submitted');
  if (submittedSubmissions.length === 0) return 0;
  const passedSubmissions = submittedSubmissions.filter(sub => sub.passed);
  return (passedSubmissions.length / submittedSubmissions.length) * 100;
});

// Instance method to submit assessment
assessmentSchema.methods.submitAssessment = function(studentId, answers, timeSpent) {
  // Check if assessment is published
  if (!this.isPublished) {
    throw new Error('Assessment is not published');
  }
  
  // Check if due date has passed
  if (new Date() > this.dueDate) {
    throw new Error('Assessment due date has passed');
  }
  
  // Find existing submission
  let submission = this.submissions.find(sub => sub.student.toString() === studentId.toString());
  
  if (submission) {
    // Check if multiple attempts are allowed
    if (!this.allowMultipleAttempts) {
      throw new Error('Multiple attempts are not allowed for this assessment');
    }
    
    // Check max attempts
    const attempts = this.submissions.filter(sub => sub.student.toString() === studentId.toString() && sub.status === 'submitted').length;
    if (attempts >= this.maxAttempts) {
      throw new Error('Maximum attempts exceeded');
    }
  }
  
  // Create new submission
  submission = {
    student: studentId,
    submittedAt: new Date(),
    answers: [],
    score: 0,
    percentage: 0,
    passed: false,
    timeSpent: timeSpent,
    status: 'submitted'
  };
  
  // Process answers
  let totalScore = 0;
  answers.forEach((answer, index) => {
    if (index < this.questions.length) {
      const question = this.questions[index];
      const isCorrect = this.checkAnswer(question, answer.answer);
      
      submission.answers.push({
        questionIndex: index,
        answer: answer.answer,
        isCorrect: isCorrect
      });
      
      if (isCorrect) {
        totalScore += question.points;
      }
    }
  });
  
  submission.score = totalScore;
  submission.percentage = (totalScore / this.totalPoints) * 100;
  submission.passed = submission.score >= this.passingScore;
  
  this.submissions.push(submission);
  return this.save();
};

// Instance method to check answer
assessmentSchema.methods.checkAnswer = function(question, answer) {
  if (question.type === 'multiple-choice' || question.type === 'true-false') {
    return question.correctAnswer.toLowerCase() === answer.toLowerCase();
  } else if (question.type === 'fill-blank') {
    return question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
  } else {
    // For short-answer and essay, manual grading is required
    return null; // Indicates manual grading needed
  }
};

// Instance method to grade submission
assessmentSchema.methods.gradeSubmission = function(studentId, score, feedback, gradedBy) {
  const submission = this.submissions.find(sub => sub.student.toString() === studentId.toString());
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.score = score;
  submission.percentage = (score / this.maxScore) * 100;
  submission.passed = submission.score >= this.passingScore;
  submission.feedback = feedback;
  submission.gradedBy = gradedBy;
  submission.gradedAt = new Date();
  submission.status = 'graded';
  
  return this.save();
};

// Static method to find published assessments
assessmentSchema.statics.findPublishedAssessments = function() {
  return this.find({ isPublished: true, isActive: true })
    .populate('course', 'title code')
    .populate('instructor', 'firstName lastName email');
};

// Static method to find assessments by course
assessmentSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId, isActive: true })
    .populate('instructor', 'firstName lastName email')
    .populate('submissions.student', 'firstName lastName email');
};

// Static method to find upcoming assessments
assessmentSchema.statics.findUpcomingAssessments = function() {
  const now = new Date();
  return this.find({ 
    scheduledDate: { $gte: now },
    isPublished: true,
    isActive: true 
  })
    .populate('course', 'title code')
    .populate('instructor', 'firstName lastName email')
    .sort({ scheduledDate: 1 });
};

// To JSON transformation
assessmentSchema.methods.toJSON = function() {
  const assessmentObject = this.toObject();
  delete assessmentObject.__v;
  return assessmentObject;
};

module.exports = mongoose.model('Assessment', assessmentSchema);
