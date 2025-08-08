const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedLessons: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    exercisesCompleted: [{
      exerciseId: mongoose.Schema.Types.ObjectId,
      score: Number,
      completedAt: Date
    }]
  }],
  currentLesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  progress: {
    type: Number, // percentage (0-100)
    default: 0,
    min: 0,
    max: 100
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  certificateEarned: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String,
    default: ''
  },
  certificateIssuedAt: {
    type: Date
  },
  certificateId: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed', 'certified'],
    default: 'enrolled'
  },
  notes: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    timestamp: Number, // for video bookmarks
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  quizScores: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    score: Number,
    totalQuestions: Number,
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ user: 1, status: 1 });
progressSchema.index({ course: 1, status: 1 });
progressSchema.index({ certificateId: 1 });

// Virtual for completed lessons count
progressSchema.virtual('completedLessonsCount').get(function() {
  return this.completedLessons.length;
});

// Virtual for formatted total time spent
progressSchema.virtual('formattedTotalTime').get(function() {
  const hours = Math.floor(this.totalTimeSpent / 3600);
  const minutes = Math.floor((this.totalTimeSpent % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
});

// Virtual for average quiz score
progressSchema.virtual('averageQuizScore').get(function() {
  if (this.quizScores.length === 0) {
    return 0;
  }
  
  const totalScore = this.quizScores.reduce((sum, quiz) => sum + quiz.score, 0);
  const totalQuestions = this.quizScores.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
  
  return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
});

// Method to update progress percentage
progressSchema.methods.updateProgress = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course).populate('lessons');
  
  if (!course) {
    return;
  }
  
  const totalLessons = course.lessons.length;
  const completedCount = this.completedLessons.length;
  
  this.progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  
  // Update status based on progress
  if (this.progress === 100) {
    this.status = 'completed';
  } else if (this.progress > 0) {
    this.status = 'in-progress';
  }
  
  await this.save();
};

// Method to mark lesson as completed
progressSchema.methods.completeLesson = async function(lessonId, timeSpent = 0) {
  const isAlreadyCompleted = this.completedLessons.some(
    completed => completed.lesson.toString() === lessonId.toString()
  );
  
  if (!isAlreadyCompleted) {
    this.completedLessons.push({
      lesson: lessonId,
      timeSpent: timeSpent
    });
    
    this.totalTimeSpent += timeSpent;
    this.lastAccessed = new Date();
    
    await this.updateProgress();
  }
};

// Method to generate certificate
progressSchema.methods.generateCertificate = async function() {
  if (this.progress === 100 && !this.certificateEarned) {
    this.certificateEarned = true;
    this.certificateIssuedAt = new Date();
    this.certificateId = `CERT-${this.user}-${this.course}-${Date.now()}`;
    this.status = 'certified';
    
    // Generate certificate URL (placeholder for now)
    this.certificateUrl = `/certificates/${this.certificateId}`;
    
    await this.save();
  }
};

// Ensure virtual fields are serialized
progressSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

module.exports = mongoose.model('Progress', progressSchema);
