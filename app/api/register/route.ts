import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
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

    if (!name || !phone || !district || !password)
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 },
      )

    if (!/^\d{10}$/.test(phone.trim()))
      return NextResponse.json(
        { error: 'Phone must be 10 digits.' },
        { status: 400 },
      )

    if (password.length < 6)
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 },
      )

    const email = `${phone.trim()}@krishimitr.app`

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name.trim(),
    })

    await adminDb.collection('users').doc(userRecord.uid).set({
      name: name.trim(),
      phone: phone.trim(),
      district: district.trim(),
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: 'Account created successfully.',
        user: {
          id: userRecord.uid,
          name: name.trim(),
          phone: phone.trim(),
          district: district.trim(),
        },
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('email-already-exists'))
      return NextResponse.json(
        { error: 'Account with this phone already exists.' },
        { status: 409 },
      )
    console.error('[REGISTER ERROR]', message)
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 },
    )
  }
}
