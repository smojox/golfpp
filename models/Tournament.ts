import mongoose from 'mongoose'

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  paid: {
    type: Boolean,
    default: false,
  },
})

const leaderboardEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalScore: {
    type: Number,
    required: true,
  },
  rounds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
  }],
})

const bestDressedSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  description: String,
  votes: {
    type: Number,
    default: 0,
  },
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
})

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  format: {
    type: String,
    enum: ['stroke-play', 'match-play', 'scramble'],
    required: true,
  },
  maxParticipants: {
    type: Number,
    required: true,
  },
  entryFee: {
    type: Number,
    default: 0,
  },
  prizes: {
    first: String,
    second: String,
    third: String,
    bestDressed: String,
  },
  participants: [participantSchema],
  leaderboard: [leaderboardEntrySchema],
  bestDressed: {
    submissions: [bestDressedSubmissionSchema],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming',
  },
}, {
  timestamps: true,
})

export default mongoose.models.Tournament || mongoose.model('Tournament', tournamentSchema)