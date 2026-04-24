import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.MONGODB_DB || 'krishimitra'

export async function POST(req: NextRequest) {
  try {
    // 1. Parse body
    let body: { username?: string; password?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 },
      )
    }

    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required.' },
        { status: 400 },
      )
    }

    // 2. Connect
    const mongo = await clientPromise
    const db = mongo.db(DB_NAME)
    const users = db.collection('users')

    // 3. Find user by phone (stored as username) or phone field
    const trimmed = username.trim()
    const user = await users.findOne({
      $or: [{ username: trimmed }, { phone: trimmed }],
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this phone number.' },
        { status: 401 },
      )
    }

    // 4. Verify password
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return NextResponse.json(
        { error: 'Wrong password. Please try again.' },
        { status: 401 },
      )
    }

    // 5. Return safe user data
    return NextResponse.json({
      message: 'Login successful.',
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        phone: user.phone,
        district: user.district,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[LOGIN ERROR]', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 },
    )
  }
}
