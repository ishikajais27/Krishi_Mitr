import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function PATCH(req: NextRequest) {
  const uid = req.headers.get('x-uid')
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { chatId, messages } = await req.json()
    const ref = adminDb.collection('chats').doc(chatId)
    const doc = await ref.get()

    if (!doc.exists || doc.data()?.uid !== uid)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await ref.update({
      messages: FieldValue.arrayUnion(...messages),
      updatedAt: new Date(),
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
