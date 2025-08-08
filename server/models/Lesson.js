const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [100, 'Lesson title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Lesson slug is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  videoUrl: {
    type: String,
    default: ''
  },
  videoDuration: {
    type: Number, // in seconds
    default: 0
  },
  thumbnail: {
    type: String,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Lesson must belong to a course']
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required'],
    min: [1, 'Lesson order must be at least 1']
  },
  lessonType: {
    type: String,
    enum: ['video', 'text', 'interactive', 'quiz', 'project'],
    default: 'video'
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['pdf', 'doc', 'zip', 'link', 'image'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: String
  }],
  exercises: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-blank', 'coding', 'project'],
      required: true
    },
    question: {
      type: String,
      required: true
    },
    options: [String], // for multiple choice questions
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    explanation: String,
    points: {
      type: Number,
      default: 1
    }
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 15
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ slug: 1 });
lessonSchema.index({ isPublished: 1 });

// Virtual for formatted duration
lessonSchema.virtual('formattedDuration').get(function() {
  if (this.videoDuration === 0) {
    return `${this.estimatedTime}m`;
  }
  
  const minutes = Math.floor(this.videoDuration / 60);
  const seconds = this.videoDuration % 60;
  
  if (minutes === 0) {
    return `${seconds}s`;
  } else if (seconds === 0) {
    return `${minutes}m`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
});

// Virtual for total exercises count
lessonSchema.virtual('totalExercises').get(function() {
  return this.exercises.length;
});

// Virtual for total resources count
lessonSchema.virtual('totalResources').get(function() {
  return this.resources.length;
});

// Ensure virtual fields are serialized
lessonSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

module.exports = mongoose.model('Lesson', lessonSchema);
