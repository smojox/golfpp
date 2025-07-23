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

    await dbConnect()
    
    // Verify user exists
    const user = await User.findById(token.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const tournament = await Tournament.findById(params.id)
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check if tournament is still accepting registrations
    if (tournament.status !== 'upcoming') {
      return NextResponse.json(
        { error: 'Tournament registration is closed' },
        { status: 400 }
      )
    }

    // Check if user is already registered
    const isAlreadyRegistered = tournament.participants.some(
      (participant: any) => participant.userId.toString() === token.id
    )

    if (isAlreadyRegistered) {
      return NextResponse.json(
        { error: 'You are already registered for this tournament' },
        { status: 400 }
      )
    }

    // Check if tournament is full
    if (tournament.participants.length >= tournament.maxParticipants) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      )
    }

    // Register user
    tournament.participants.push({
      userId: token.id,
      registrationDate: new Date(),
      paid: false,
    })

    await tournament.save()

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for tournament'
    })

  } catch (error) {
    console.error('Tournament registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register for tournament' },
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

    await dbConnect()
    
    const tournament = await Tournament.findById(params.id)
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Remove user from participants
    tournament.participants = tournament.participants.filter(
      (participant: any) => participant.userId.toString() !== token.id
    )

    await tournament.save()

    return NextResponse.json({
      success: true,
      message: 'Successfully unregistered from tournament'
    })

  } catch (error) {
    console.error('Tournament unregistration error:', error)
    return NextResponse.json(
      { error: 'Failed to unregister from tournament' },
      { status: 500 }
    )
  }
}