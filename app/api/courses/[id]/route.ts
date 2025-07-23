import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db'
import Course from '@/models/Course'
import User from '@/models/User'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    await dbConnect()
    const user = await User.findById(token.id)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Check if user is admin (also allow admin@golfpigeon.com as fallback)
    const isAdmin = user.role === 'admin' || user.email === 'admin@golfpigeon.com'
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { holes } = body

    // Validate holes data
    if (!holes || !Array.isArray(holes)) {
      return NextResponse.json(
        { error: 'Invalid holes data' },
        { status: 400 }
      )
    }

    // Validate each hole
    for (const hole of holes) {
      if (!hole.number || !hole.par || hole.par < 3 || hole.par > 6) {
        return NextResponse.json(
          { error: 'Invalid hole data - par must be between 3 and 6' },
          { status: 400 }
        )
      }
    }

    const course = await Course.findByIdAndUpdate(
      params.id,
      { holes },
      { new: true }
    )

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      course
    })

  } catch (error) {
    console.error('Course update error:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    await dbConnect()
    const user = await User.findById(token.id)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Check if user is admin (also allow admin@golfpigeon.com as fallback)
    const isAdmin = user.role === 'admin' || user.email === 'admin@golfpigeon.com'
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Check if course is being used in any tournaments
    const Tournament = (await import('@/models/Tournament')).default
    const tournaments = await Tournament.find({ courseId: params.id })
    
    if (tournaments.length > 0) {
      return NextResponse.json({
        error: `Cannot delete course - it is being used in ${tournaments.length} tournament(s)`
      }, { status: 400 })
    }

    const course = await Course.findByIdAndDelete(params.id)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })

  } catch (error) {
    console.error('Course deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}