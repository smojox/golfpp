import mongoose from 'mongoose'

const scoreSchema = new mongoose.Schema({
  hole: {
    type: Number,
    required: true,
  },
  strokes: {
    type: Number,
    required: true,
  },
  par: {
    type: Number,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  strokesOverPar: {
    type: Number,
    required: true,
  },
  putts: {
    type: Number,
    default: null,
  },
  club: {
    type: String,
    default: null,
  },
})

const roundSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    default: null,
  },
  date: {
    type: Date,
    required: true,
  },
  tee: {
    type: String,
    enum: ['black', 'blue', 'white', 'red'],
    default: 'white',
  },
  scores: [scoreSchema],
  holes: [scoreSchema], // Support both fields for compatibility
  totalScore: {
    type: Number,
    required: true,
  },
  totalPar: {
    type: Number,
    required: true,
  },
  weather: {
    temperature: Number,
    conditions: String,
    windSpeed: Number,
  },
  photos: [String],
  notes: String,
  status: {
    type: String,
    enum: ['submitted', 'confirmed', 'rejected'],
    default: 'submitted'
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  confirmedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
})

export default mongoose.models.Round || mongoose.model('Round', roundSchema)