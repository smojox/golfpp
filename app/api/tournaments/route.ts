import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db'
import Tournament from '@/models/Tournament'
import User from '@/models/User'
import Course from '@/models/Course'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const tournaments = await Tournament.find({})
      .populate('courseId', 'name')
      .populate('organizerId', 'name')
      .sort({ startDate: 1 })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
        error: 'Admin access required',
        debug: { userRole: user.role, userEmail: user.email }
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      courseId,
      startDate,
      endDate,
      format,
      maxParticipants,
      entryFee,
      prizes
    } = body

    // Validate required fields
    if (!name || !courseId || !startDate || !endDate || !format || !maxParticipants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      )
    }

    const tournament = await Tournament.create({
      name,
      description,
      courseId,
      organizerId: token.id,
      startDate: start,
      endDate: end,
      format,
      maxParticipants,
      entryFee: entryFee || 0,
      prizes: prizes || {},
      participants: [],
      leaderboard: [],
      bestDressed: {
        submissions: [],
        winner: null
      }
    })

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament._id,
        name: tournament.name,
        description: tournament.description,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        format: tournament.format,
        maxParticipants: tournament.maxParticipants,
        entryFee: tournament.entryFee,
        status: tournament.status
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Tournament creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}