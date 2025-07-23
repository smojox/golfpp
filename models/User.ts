import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  handicap: {
    type: Number,
    default: 0,
  },
  homeCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  preferences: {
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'imperial',
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  stats: {
    totalRounds: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    bestRound: {
      type: Number,
      default: null,
    },
    totalBirdies: {
      type: Number,
      default: 0,
    },
    totalEagles: {
      type: Number,
      default: 0,
    },
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  achievements: [{
    type: String,
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
})

export default mongoose.models.User || mongoose.model('User', userSchema)