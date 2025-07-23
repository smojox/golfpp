import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db'
import Tournament from '@/models/Tournament'
import User from '@/models/User'

export async function POST(
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

    const tournament = await Tournament.findById(params.id)
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check if tournament can be closed
    if (tournament.status === 'completed') {
      return NextResponse.json({ 
        error: 'Tournament is already completed' 
      }, { status: 400 })
    }

    // Update tournament status to completed
    tournament.status = 'completed'
    await tournament.save()

    // Determine winners based on leaderboard
    const winners = {
      first: tournament.leaderboard[0] || null,
      second: tournament.leaderboard[1] || null,
      third: tournament.leaderboard[2] || null
    }

    return NextResponse.json({
      success: true,
      message: 'Tournament closed successfully',
      tournament: {
        id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        winners
      }
    })

  } catch (error) {
    console.error('Tournament closure error:', error)
    return NextResponse.json(
      { error: 'Failed to close tournament' },
      { status: 500 }
    )
  }
}