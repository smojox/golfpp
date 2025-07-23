import mongoose from 'mongoose'

const holeSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
  },
  par: {
    type: Number,
    required: true,
  },
  yardage: {
    black: { type: Number, default: 0 },
    blue: { type: Number, default: 0 },
    white: { type: Number, default: 0 },
    red: { type: Number, default: 0 },
  },
  handicap: {
    type: Number,
    required: true,
  },
})

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: [Number], // [longitude, latitude]
  },
  holes: [holeSchema],
  rating: {
    slope: Number,
    courseRating: Number,
  },
  contact: {
    phone: String,
    website: String,
  },
}, {
  timestamps: true,
})

export default mongoose.models.Course || mongoose.model('Course', courseSchema)