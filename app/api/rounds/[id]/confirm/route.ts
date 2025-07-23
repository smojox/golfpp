import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db'
import Round from '@/models/Round'
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

    const { action } = await request.json() // 'confirm' or 'reject'

    const round = await Round.findById(params.id)
    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status === 'confirmed') {
      return NextResponse.json({ 
        error: 'Round is already confirmed' 
      }, { status: 400 })
    }

    round.status = action === 'confirm' ? 'confirmed' : 'rejected'
    round.confirmedBy = token.id
    round.confirmedAt = new Date()
    
    await round.save()

    return NextResponse.json({
      success: true,
      round: {
        id: round._id,
        status: round.status,
        confirmedAt: round.confirmedAt
      }
    })

  } catch (error) {
    console.error('Round confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm round' },
      { status: 500 }
    )
  }
}