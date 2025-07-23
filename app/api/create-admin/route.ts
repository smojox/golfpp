import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@golfpigeon.com' })
    if (existingAdmin) {
      // Ensure admin has correct role
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin'
        await existingAdmin.save()
      }
      
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role,
          id: existingAdmin._id
        }
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('PigeonAdmin2025!', 12)
    
    const adminUser = await User.create({
      email: 'admin@golfpigeon.com',
      password: hashedPassword,
      name: 'Golf Pigeon Admin',
      handicap: 0,
      role: 'admin',
      preferences: {
        units: 'imperial',
        notifications: true
      },
      stats: {
        totalRounds: 0,
        averageScore: 0,
        bestRound: null,
        totalBirdies: 0,
        totalEagles: 0
      },
      achievements: ['Admin Master', 'Pigeon Founder']
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        email: adminUser.email,
        name: adminUser.name,
        id: adminUser._id,
        handicap: adminUser.handicap,
        achievements: adminUser.achievements
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Admin creation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}