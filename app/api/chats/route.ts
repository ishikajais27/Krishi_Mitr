import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const uid = req.headers.get('x-uid')
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const snapshot = await adminDb
      .collection('chats')
      .where('uid', '==', uid)
      .get()
    const sessions = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(
        (a: any, b: any) =>
          (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0),
      )
    return NextResponse.json({ sessions })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const uid = req.headers.get('x-uid')
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title } = await req.json()
  const ref = await adminDb.collection('chats').add({
    uid,
    title: title || 'Naya Baat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  })
  return NextResponse.json({ id: ref.id })
}

export async function DELETE(req: NextRequest) {
  const uid = req.headers.get('x-uid')
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const doc = await adminDb.collection('chats').doc(id).get()
  if (!doc.exists || doc.data()?.uid !== uid)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await adminDb.collection('chats').doc(id).delete()
  return NextResponse.json({ success: true })
}
