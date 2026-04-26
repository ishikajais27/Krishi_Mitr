import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const upstream = new FormData()
    upstream.append('image', file) // their API uses "image"

    const mlRes = await fetch('https://livestock-doc.vercel.app/api/analyze', {
      method: 'POST',
      body: upstream,
    })

    if (!mlRes.ok) {
      const errText = await mlRes.text()
      return NextResponse.json(
        { error: `Upstream error: ${mlRes.status}`, detail: errText },
        { status: mlRes.status },
      )
    }

    const data = await mlRes.json()
    return NextResponse.json(data) // pass through raw
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
