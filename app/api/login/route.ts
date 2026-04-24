import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
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
    if (!username || !password)
      return NextResponse.json(
        { error: 'Phone and password are required.' },
        { status: 400 },
      )

    const email = `${username.trim()}@krishimitr.app`
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    )

    if (!signInRes.ok) {
      const err = await signInRes.json()
      const code = err?.error?.message
      if (code === 'EMAIL_NOT_FOUND' || code === 'INVALID_EMAIL')
        return NextResponse.json(
          { error: 'No account found with this phone number.' },
          { status: 401 },
        )
      if (code === 'INVALID_PASSWORD' || code === 'INVALID_LOGIN_CREDENTIALS')
        return NextResponse.json(
          { error: 'Wrong password. Please try again.' },
          { status: 401 },
        )
      return NextResponse.json({ error: 'Login failed.' }, { status: 401 })
    }

    const firebaseData = await signInRes.json()
    const uid = firebaseData.localId

    const userDoc = await adminDb.collection('users').doc(uid).get()
    const userData = userDoc.data()

    return NextResponse.json({
      message: 'Login successful.',
      user: {
        id: uid,
        name: userData?.name ?? '',
        phone: userData?.phone ?? username.trim(),
        district: userData?.district ?? '',
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
