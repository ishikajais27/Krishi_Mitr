import { NextRequest, NextResponse } from 'next/server'

const VET_DOC_API = 'https://vet-doc.vercel.app/api/analyze'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const upstream = new FormData()
    upstream.append('image', file)

    const vetRes = await fetch(VET_DOC_API, {
      method: 'POST',
      body: upstream,
    })

    if (!vetRes.ok) {
      const errText = await vetRes.text()
      return NextResponse.json(
        { error: `VetDoc API error: ${vetRes.status}`, detail: errText },
        { status: vetRes.status },
      )
    }

    const json = await vetRes.json()
    if (!json.success) {
      return NextResponse.json({ error: json.error }, { status: 500 })
    }

    const { vision, research } = json.data

    return NextResponse.json({
      status: 'success',
      predicted_class: vision.diseaseName
        ? `${vision.cropIdentified}___${vision.diseaseName.replace(/ /g, '_')}`
        : `${vision.cropIdentified}___Healthy`,
      odia_name: vision.cropIdentified,
      confidence:
        vision.confidence === 'high'
          ? 92
          : vision.confidence === 'medium'
            ? 68
            : 40,
      severity:
        vision.overallHealth === 'severe'
          ? 'high'
          : vision.overallHealth === 'moderate'
            ? 'moderate'
            : 'low',
      advice_odia: vision.diseaseDescription ?? 'No issues detected.',
      see_vet:
        research.urgencyLevel === 'high' ||
        research.urgencyLevel === 'critical',
      low_confidence: vision.confidence === 'low',
      top3: [],
      // ALL extra fields
      disease_name: vision.diseaseName ?? null,
      overall_health: vision.overallHealth,
      harvest_ready: vision.harvestReady,
      harvest_note: vision.harvestNote,
      treatment: research.treatment,
      prevention: research.prevention,
      organic_treatment: research.organicTreatment ?? null,
      chemical_treatment: research.chemicalTreatment ?? null,
      urgency_level: research.urgencyLevel,
      estimated_recovery_days: research.estimatedRecoveryDays ?? null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
