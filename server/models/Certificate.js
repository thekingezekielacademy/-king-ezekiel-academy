const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: [true, 'Certificate ID is required'],
    unique: true,
    trim: true
  },
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
  progress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Progress',
    required: [true, 'Progress record is required']
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  certificateUrl: {
    type: String,
    required: [true, 'Certificate URL is required']
  },
  certificateData: {
    userName: String,
    courseName: String,
    completionDate: Date,
    courseDuration: String,
    instructorName: String,
    grade: {
      type: String,
      enum: ['pass', 'merit', 'distinction'],
      default: 'pass'
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  verificationCode: {
    type: String,
    required: [true, 'Verification code is required'],
    unique: true
  },
  template: {
    type: String,
    default: 'default'
  },
  metadata: {
    issuedBy: {
      type: String,
      default: 'King Ezekiel Academy'
    },
    platform: {
      type: String,
      default: 'Digital Skills Learning Platform'
    },
    version: {
      type: String,
      default: '1.0'
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  lastVerified: {
    type: Date
  },
  verificationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ user: 1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ status: 1 });

// Virtual for certificate age
certificateSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const issued = new Date(this.issuedAt);
  const diffTime = Math.abs(now - issued);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted issue date
certificateSchema.virtual('formattedIssueDate').get(function() {
  return this.issuedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted expiry date
certificateSchema.virtual('formattedExpiryDate').get(function() {
  if (!this.expiresAt) return 'Never';
  return this.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to generate verification code
certificateSchema.methods.generateVerificationCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.verificationCode = result;
  return result;
};

// Method to verify certificate
certificateSchema.methods.verify = function() {
  if (this.status !== 'active') {
    return { valid: false, reason: 'Certificate is not active' };
  }
  
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
    this.save();
    return { valid: false, reason: 'Certificate has expired' };
  }
  
  this.lastVerified = new Date();
  this.verificationCount += 1;
  this.save();
  
  return { valid: true, certificate: this };
};

// Method to revoke certificate
certificateSchema.methods.revoke = function(reason = '') {
  this.status = 'revoked';
  this.save();
  return { revoked: true, reason };
};

// Static method to create certificate from progress
certificateSchema.statics.createFromProgress = async function(progressId) {
  const Progress = mongoose.model('Progress');
  const Course = mongoose.model('Course');
  const User = mongoose.model('User');
  
  const progress = await Progress.findById(progressId)
    .populate('user')
    .populate('course');
  
  if (!progress || progress.progress < 100) {
    throw new Error('Progress not found or course not completed');
  }
  
  const certificate = new this({
    certificateId: `CERT-${progress.user._id}-${progress.course._id}-${Date.now()}`,
    user: progress.user._id,
    course: progress.course._id,
    progress: progress._id,
    certificateData: {
      userName: progress.user.getFullName(),
      courseName: progress.course.title,
      completionDate: new Date(),
      courseDuration: progress.course.formattedDuration,
      instructorName: 'King Ezekiel Academy', // Will be populated from course.instructor
      grade: progress.averageQuizScore >= 90 ? 'distinction' : 
             progress.averageQuizScore >= 80 ? 'merit' : 'pass',
      score: progress.averageQuizScore
    }
  });
  
  certificate.generateVerificationCode();
  certificate.certificateUrl = `/certificates/${certificate.certificateId}`;
  
  await certificate.save();
  return certificate;
};

// Ensure virtual fields are serialized
certificateSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

module.exports = mongoose.model('Certificate', certificateSchema);
