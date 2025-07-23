import { NextRequest, NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seedData'

export async function POST(request: NextRequest) {
  try {
    const courses = await seedDatabase()
    return NextResponse.json({ 
      message: 'Database seeded successfully',
      courses: courses.length 
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}