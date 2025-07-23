import dbConnect from './db'
import Course from '../models/Course'
import User from '../models/User'

export const sampleCourses = [
  {
    name: "Pigeon Valley Golf Club",
    location: {
      address: "123 Golf Course Drive",
      city: "Golf City",
      state: "CA",
      country: "USA",
      coordinates: [-122.4194, 37.7749]
    },
    holes: Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      par: i % 3 === 0 ? 5 : i % 2 === 0 ? 4 : 3,
      yardage: {
        black: 400 + Math.floor(Math.random() * 200),
        blue: 380 + Math.floor(Math.random() * 180),
        white: 360 + Math.floor(Math.random() * 160),
        red: 320 + Math.floor(Math.random() * 140),
      },
      handicap: (i % 18) + 1,
    })),
    rating: {
      slope: 113,
      courseRating: 72.1,
    },
    contact: {
      phone: "(555) 123-4567",
      website: "https://pigeonvalleygolf.com",
    },
  },
  {
    name: "Eagle's Nest Country Club",
    location: {
      address: "456 Country Club Lane",
      city: "Golf City",
      state: "CA",
      country: "USA",
      coordinates: [-122.4094, 37.7849]
    },
    holes: Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      par: i % 3 === 1 ? 5 : i % 2 === 1 ? 4 : 3,
      yardage: {
        black: 420 + Math.floor(Math.random() * 180),
        blue: 400 + Math.floor(Math.random() * 160),
        white: 380 + Math.floor(Math.random() * 140),
        red: 340 + Math.floor(Math.random() * 120),
      },
      handicap: ((i + 5) % 18) + 1,
    })),
    rating: {
      slope: 118,
      courseRating: 71.8,
    },
    contact: {
      phone: "(555) 234-5678",
      website: "https://eaglesnestcc.com",
    },
  },
  {
    name: "Feather Creek Golf Course",
    location: {
      address: "789 Creek Road",
      city: "Golf City",
      state: "CA",
      country: "USA",
      coordinates: [-122.3994, 37.7949]
    },
    holes: Array.from({ length: 9 }, (_, i) => ({
      number: i + 1,
      par: i % 3 === 2 ? 5 : i % 2 === 0 ? 4 : 3,
      yardage: {
        black: 380 + Math.floor(Math.random() * 160),
        blue: 360 + Math.floor(Math.random() * 140),
        white: 340 + Math.floor(Math.random() * 120),
        red: 300 + Math.floor(Math.random() * 100),
      },
      handicap: (i % 9) + 1,
    })),
    rating: {
      slope: 110,
      courseRating: 35.5,
    },
    contact: {
      phone: "(555) 345-6789",
      website: "https://feathercreekgolf.com",
    },
  },
]

export async function seedDatabase() {
  try {
    await dbConnect()
    
    // Clear existing courses
    await Course.deleteMany({})
    
    // Insert sample courses
    const courses = await Course.insertMany(sampleCourses)
    console.log('Sample courses inserted:', courses.length)
    
    return courses
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}