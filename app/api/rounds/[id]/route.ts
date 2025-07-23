import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db'
import Round from '@/models/Round'
import User from '@/models/User'
import Tournament from '@/models/Tournament'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const round = await Round.findById(params.id)
      .populate('courseId', 'name holes')
      .populate('tournamentId', 'name')
      .populate('userId', 'name')

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    // Check if user owns this round or is admin
    const user = await User.findById(token.id)
    const isAdmin = user?.role === 'admin' || user?.email === 'admin@golfpigeon.com'
    
    if (round.userId._id.toString() !== token.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ round })

  } catch (error) {
    console.error('Error fetching round:', error)
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const round = await Round.findById(params.id)

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    // Check if user owns this round or is admin
    const user = await User.findById(token.id)
    const isAdmin = user?.role === 'admin' || user?.email === 'admin@golfpigeon.com'
    
    if (round.userId.toString() !== token.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If not admin and round is confirmed, don't allow editing
    if (!isAdmin && round.status === 'confirmed') {
      return NextResponse.json({ 
        error: 'Cannot edit confirmed scores' 
      }, { status: 400 })
    }

    const updateData = await request.json()
    
    // Update the round
    Object.assign(round, updateData)
    
    // If admin is editing, keep confirmed status, otherwise reset to submitted
    if (!isAdmin) {
      round.status = 'submitted'
      round.confirmedBy = null
      round.confirmedAt = null
    }
    
    await round.save()

    // Update tournament leaderboard if this is a tournament round
    if (round.tournamentId) {
      await updateTournamentLeaderboard(round.tournamentId.toString(), round.userId.toString(), round.totalScore)
    }

    return NextResponse.json({
      success: true,
      round
    })

  } catch (error) {
    console.error('Error updating round:', error)
    return NextResponse.json(
      { error: 'Failed to update round' },
      { status: 500 }
    )
  }
}

async function updateTournamentLeaderboard(tournamentId: string, userId: string, totalScore: number) {
  try {
    const tournament = await Tournament.findById(tournamentId)
    if (!tournament) return

    // Find existing leaderboard entry for this user
    const existingEntryIndex = tournament.leaderboard.findIndex(
      (entry: any) => entry.userId.toString() === userId
    )

    if (existingEntryIndex >= 0) {
      // Update existing entry with new score
      tournament.leaderboard[existingEntryIndex].totalScore = totalScore
    } else {
      // Add new leaderboard entry
      tournament.leaderboard.push({
        userId,
        totalScore,
        rounds: []
      })
    }

    // Sort leaderboard by score (lowest first)
    tournament.leaderboard.sort((a: any, b: any) => a.totalScore - b.totalScore)

    await tournament.save()
  } catch (error) {
    console.error('Error updating tournament leaderboard:', error)
  }
}