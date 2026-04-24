import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

const DB_NAME = process.env.MONGODB_DB || 'krishimitra'

export async function POST(req: NextRequest) {
  try {
    // 1. Parse body
    let body: {
      name?: string
      phone?: string
      district?: string
      password?: string
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400 },
      )
    }

    const { name, phone, district, password } = body

    if (!name || !phone || !district || !password) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 },
      )
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 10 digits.' },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 },
      )
    }

    // 2. Connect
    const mongo = await clientPromise
    const db = mongo.db(DB_NAME)
    const users = db.collection('users')

    // 3. Check duplicate
    const username = phone.trim()
    const existing = await users.findOne({ username })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists.' },
        { status: 409 },
      )
    }

    // 4. Hash & insert
    const hashedPassword = await bcrypt.hash(password, 12)
    const result = await users.insertOne({
      name: name.trim(),
      phone: phone.trim(),
      district: district.trim(),
      username,
      password: hashedPassword,
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user: {
          id: result.insertedId.toString(),
          name: name.trim(),
          username,
          phone: phone.trim(),
          district: district.trim(),
        },
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[REGISTER ERROR]', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 },
    )
  }
}
