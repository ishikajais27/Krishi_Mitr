import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const uid = req.headers.get('x-uid')
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const now = new Date()
    const snapshot = await adminDb
      .collection('chats')
      .where('uid', '==', uid)
      .where('expiresAt', '<=', now)
      .get()

    const batch = adminDb.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    return NextResponse.json({ deleted: snapshot.size })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
