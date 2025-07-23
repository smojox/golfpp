import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db'
import Round from '@/models/Round'
import Tournament from '@/models/Tournament'
import User from '@/models/User'
import Course from '@/models/Course'

async function updateTournamentLeaderboard(tournamentId: string, userId: string, totalScore: number) {
  try {
    const tournament = await Tournament.findById(tournamentId)
    if (!tournament) return

    // Find existing leaderboard entry for this user
    const existingEntryIndex = tournament.leaderboard.findIndex(
      (entry: any) => entry.userId.toString() === userId
    )

    if (existingEntryIndex >= 0) {
      // Update existing entry with best score
      if (totalScore < tournament.leaderboard[existingEntryIndex].totalScore) {
        tournament.leaderboard[existingEntryIndex].totalScore = totalScore
      }
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

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    // Check if user is admin
    const user = await User.findById(token.id)
    const isAdmin = user?.role === 'admin' || user?.email === 'admin@golfpigeon.com'
    
    let query: any = {}
    
    if (status && isAdmin) {
      // Admin can filter by status and see all rounds
      query.status = status
    } else {
      // Regular users only see their own rounds
      query.userId = token.id
    }

    const rounds = await Round.find(query)
      .populate('courseId', 'name holes')
      .populate('tournamentId', 'name')
      .populate('userId', 'name')
      .sort({ date: -1 })

    return NextResponse.json({ rounds })
  } catch (error) {
    console.error('Error fetching rounds:', error)
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const roundData = await request.json()
    console.log('Received round data:', roundData)
    await dbConnect()

    const round = await Round.create({
      ...roundData,
      userId: token.id,
    })
    console.log('Round created successfully:', round._id)

    // Update user stats
    const user = await User.findById(token.id)
    if (user) {
      user.stats.totalRounds += 1
      
      // Calculate new average
      const totalScore = user.stats.averageScore * (user.stats.totalRounds - 1) + roundData.totalScore
      user.stats.averageScore = Math.round(totalScore / user.stats.totalRounds)
      
      // Update best round
      if (!user.stats.bestRound || roundData.totalScore < user.stats.bestRound) {
        user.stats.bestRound = roundData.totalScore
      }
      
      await user.save()
    }

    // If this is a tournament round, update the tournament leaderboard
    if (roundData.tournamentId) {
      await updateTournamentLeaderboard(roundData.tournamentId, token.id, roundData.totalScore)
    }

    return NextResponse.json({ round }, { status: 201 })
  } catch (error) {
    console.error('Error creating round:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}