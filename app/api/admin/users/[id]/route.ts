import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import Round from '@/models/Round'
import Tournament from '@/models/Tournament'

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
    const adminUser = await User.findById(token.id)
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }
    
    // Check if user is admin (also allow admin@golfpigeon.com as fallback)
    const isAdmin = adminUser.role === 'admin' || adminUser.email === 'admin@golfpigeon.com'
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { action } = await request.json()

    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from demoting themselves
    if (targetUser._id.toString() === token.id && action === 'demote') {
      return NextResponse.json({ 
        error: 'Cannot demote yourself'
      }, { status: 400 })
    }

    if (action === 'promote') {
      targetUser.role = 'admin'
      await targetUser.save()
      
      return NextResponse.json({
        success: true,
        message: `${targetUser.name} has been promoted to admin`,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        }
      })
    } else if (action === 'demote') {
      targetUser.role = 'user'
      await targetUser.save()
      
      return NextResponse.json({
        success: true,
        message: `${targetUser.name} has been demoted to regular user`,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        }
      })
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "promote" or "demote"'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
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
    const adminUser = await User.findById(token.id)
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }
    
    // Check if user is admin (also allow admin@golfpigeon.com as fallback)
    const isAdmin = adminUser.role === 'admin' || adminUser.email === 'admin@golfpigeon.com'
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required'
      }, { status: 403 })
    }

    const targetUser = await User.findById(params.id)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (targetUser._id.toString() === token.id) {
      return NextResponse.json({ 
        error: 'Cannot delete yourself'
      }, { status: 400 })
    }

    // Check if user has participated in tournaments
    const userRounds = await Round.countDocuments({ userId: params.id })
    const userTournaments = await Tournament.countDocuments({ 
      $or: [
        { organizerId: params.id },
        { 'participants.userId': params.id },
        { 'leaderboard.userId': params.id }
      ]
    })

    if (userRounds > 0 || userTournaments > 0) {
      return NextResponse.json({
        error: `Cannot delete user - they have ${userRounds} rounds and are involved in ${userTournaments} tournaments. Consider deactivating instead.`
      }, { status: 400 })
    }

    // Delete the user
    await User.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} has been deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}