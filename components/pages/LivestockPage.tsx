'use client'
import { useState, useRef } from 'react'
import ElectricBorder from '@/components/ElectricBorder'
import TextType from '@/components/TextType'

type Remedy = {
  remedy: string
  ingredients: string
  preparation: string
  how_to_use: string
  frequency: string
}

type Medicine = {
  medicine_name: string
  generic_name: string
  dosage: string
  route: string
  frequency: string
  where_to_buy: string
  price_estimate: string
}

type Report = {
  animal_identified: string
  health_status: string
  disease_suspected: string
  symptoms_observed: string[]
  severity: string
  breed_guess: string
  confidence: string
  body_parts_affected: string[]
  vet_urgency: string
  urgency_reason: string
  gharelu_upchar: Remedy[]
  veterinary_medicines: Medicine[]
  diet_advice: string
  isolation_needed: boolean
  prevention_tips: string[]
  when_to_call_vet: string
  prognosis: string
  analyzed_at: string
}

const URGENCY_CONFIG: Record<
  string,
  { bg: string; border: string; color: string; icon: string; label: string }
> = {
  urgent: {
    bg: '#fef2f2',
    border: '#fca5a5',
    color: '#b91c1c',
    icon: '🚨',
    label: 'Turant Doctor Bulayein / Urgent Vet Needed',
  },
  monitor_2_3_days: {
    bg: '#fffbeb',
    border: '#fcd34d',
    color: '#92400e',
    icon: '👁️',
    label: '2-3 Din Dekhein / Monitor for 2-3 days',
  },
  not_urgent: {
    bg: '#f0fdf4',
    border: '#86efac',
    color: '#166534',
    icon: '✅',
    label: 'Abhi Urgent Nahi / Not Urgent',
  },
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  severe: { color: '#b91c1c', bg: '#fef2f2' },
  moderate: { color: '#92400e', bg: '#fffbeb' },
  mild: { color: '#166534', bg: '#f0fdf4' },
}

export default function LivestockPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setReport(null)
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/livestock', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.report)
        throw new Error(data.error || 'Analysis failed')
      setReport(data.report)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const urgency =
    URGENCY_CONFIG[report?.vet_urgency ?? ''] ?? URGENCY_CONFIG.not_urgent
  const sevCfg = SEVERITY_CONFIG[report?.severity ?? ''] ?? SEVERITY_CONFIG.mild

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lv-bg {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background-image: url('/livestock-bg.jpg');
          background-size: cover;
          background-position: center 40%;
          background-attachment: fixed;
          position: relative;
        }
        .lv-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(160deg,rgba(10,40,20,0.52) 0%,rgba(30,80,40,0.38) 40%,rgba(180,110,20,0.28) 80%,rgba(10,40,20,0.55) 100%);
          pointer-events: none;
          z-index: 0;
        }
        .lv-page {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
          padding: 3rem 1.25rem 5rem;
        }
        .hero { margin-bottom: 2rem; }
        .hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #a7f3c8;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
          margin-bottom: 0.75rem;
        }
        .hero__dot { width:6px;height:6px;background:#a7f3c8;border-radius:50%;display:inline-block;box-shadow:0 0 8px #a7f3c8; }
        .hero__title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.6rem, 5vw, 3rem);
          font-weight: 900;
          color: #0a0a0a;
          text-shadow: 0 0 40px rgba(255,255,255,0.55), 0 2px 0 rgba(255,255,255,0.9), 0 4px 24px rgba(0,0,0,0.18);
          margin-bottom: 0.75rem;
          min-height: 1.2em;
        }
        .hero__title .hero-cursor { color: #16a34a; text-shadow: 0 0 12px rgba(22,163,74,0.7); }
        .hero__desc { color: rgba(255,255,255,0.88); font-size:1rem; line-height:1.65; max-width:520px; text-shadow:0 1px 6px rgba(0,0,0,0.45); }

        .glass-card {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.65);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
          margin-bottom: 1.25rem;
        }

        .dropzone {
          border-radius: 14px;
          padding: 2.5rem 1rem;
          text-align: center;
          cursor: pointer;
          background: rgba(220,252,231,0.45);
          transition: background 0.2s, transform 0.15s;
        }
        .dropzone:hover { background: rgba(187,247,208,0.65); transform: translateY(-1px); }
        .dropzone__icon { font-size:3rem; margin-bottom:0.5rem; }
        .dropzone__label { font-size:1rem; color:#1b4332; font-weight:700; margin-bottom:0.25rem; }
        .dropzone__sub { font-size:0.82rem; color:#6b7c6b; }

        .preview-wrap { border-radius:12px; overflow:hidden; max-height:280px; display:flex; justify-content:center; background:#f0f0f0; margin-top:1rem; }
        .preview-wrap img { max-height:280px; object-fit:contain; width:100%; }

        .loader { display:flex; align-items:center; gap:0.75rem; color:#1b4332; font-weight:600; margin-top:1rem; }
        .spinner { width:22px;height:22px;border:3px solid #d8e8d0;border-top-color:#2d6a4f;border-radius:50%;animation:spin 0.7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        .error-box { background:#fff5f5; border:1px solid #fca5a5; border-radius:10px; padding:1rem 1.25rem; color:#b91c1c; font-size:0.9rem; margin-top:1rem; }

        /* ── RESULT CARDS ── */
        .result-wrap { animation: slideUp 0.4s ease both; }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

        .animal-header {
          display:flex; align-items:center; gap:1rem;
          background: linear-gradient(135deg,#fff0f0,#fff8f0);
          border: 1.5px solid #fca5a5;
          border-radius: 16px;
          padding: 1.1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .animal-emoji { font-size:2.2rem; }
        .animal-name { font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:800; color:#b91c1c; }
        .animal-sub { font-size:0.85rem; color:#888; margin-top:0.1rem; }
        .animal-badges { display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.4rem; }
        .badge {
          display:inline-flex; align-items:center; gap:0.3rem;
          font-size:0.75rem; font-weight:700; border-radius:20px;
          padding:0.2rem 0.65rem; border:1px solid;
        }

        .urgency-banner {
          border-radius:14px; padding:1rem 1.25rem;
          margin-bottom:1.25rem;
          display:flex; flex-direction:column; gap:0.3rem;
        }
        .urgency-banner__title { font-weight:800; font-size:1rem; }
        .urgency-banner__sub { font-size:0.85rem; }

        .section-card { background:#fff; border-radius:16px; padding:1.1rem 1.25rem; margin-bottom:1rem; border:1px solid #e5e7eb; }
        .section-title { font-weight:800; color:#1b4332; font-size:0.95rem; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem; }

        .disease-name { font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:800; color:#b45309; margin-bottom:0.5rem; }
        .sev-badge {
          display:inline-block; font-size:0.75rem; font-weight:800;
          border-radius:20px; padding:0.2rem 0.75rem;
          letter-spacing:0.05em; text-transform:uppercase;
        }

        .symptom-list { list-style:none; display:flex; flex-direction:column; gap:0.4rem; margin-bottom:0.6rem; }
        .symptom-list li::before { content:"• "; color:#dc2626; font-weight:800; }
        .symptom-list li { font-size:0.9rem; color:#374151; }

        .tag { display:inline-block; background:#f3f4f6; border-radius:20px; padding:0.15rem 0.6rem; font-size:0.75rem; color:#6b7280; margin-right:0.3rem; margin-top:0.3rem; }

        .remedy-card {
          border:1px solid #d1fae5; border-radius:12px;
          padding:0.9rem 1rem; margin-bottom:0.75rem;
          background:#f0fdf4;
        }
        .remedy-title { font-weight:800; color:#065f46; font-size:0.9rem; margin-bottom:0.5rem; }
        .remedy-row { font-size:0.83rem; color:#374151; margin-bottom:0.2rem; }
        .remedy-row strong { color:#1b4332; }

        .med-card {
          border:1px solid #dbeafe; border-radius:12px;
          padding:0.9rem 1rem; margin-bottom:0.75rem;
          background:#eff6ff;
        }
        .med-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.3rem; margin-bottom:0.4rem; }
        .med-name { font-weight:800; color:#1e40af; font-size:0.92rem; }
        .med-generic { font-size:0.78rem; color:#6b7280; }
        .med-price { background:#16a34a; color:#fff; border-radius:20px; padding:0.15rem 0.6rem; font-size:0.75rem; font-weight:700; white-space:nowrap; }
        .med-row { font-size:0.83rem; color:#374151; margin-bottom:0.2rem; }
        .med-row strong { color:#1e3a8a; }

        .diet-box { background:#fefce8; border:1px solid #fde68a; border-radius:10px; padding:0.75rem 1rem; font-size:0.9rem; color:#713f12; line-height:1.6; }
        .isolation-box { display:flex; align-items:center; gap:0.5rem; background:#fef2f2; border:1px solid #fca5a5; border-radius:10px; padding:0.6rem 1rem; font-size:0.85rem; color:#b91c1c; font-weight:600; margin-top:0.6rem; }

        .prevention-list { list-style:none; display:flex; flex-direction:column; gap:0.4rem; }
        .prevention-list li { font-size:0.88rem; color:#374151; display:flex; align-items:flex-start; gap:0.4rem; }
        .prevention-list li::before { content:"✓"; color:#16a34a; font-weight:800; flex-shrink:0; }

        .emergency-box { background:#fef2f2; border:1.5px solid #fca5a5; border-radius:12px; padding:0.85rem 1rem; font-size:0.88rem; color:#b91c1c; line-height:1.6; }
        .prognosis-box { font-size:0.9rem; color:#374151; line-height:1.65; }

        .disclaimer {
          text-align:center; font-size:0.78rem; color:rgba(255,255,255,0.55);
          margin-top:1.5rem; line-height:1.6;
          text-shadow:0 1px 4px rgba(0,0,0,0.4);
        }

        .reset-btn {
          display:flex; align-items:center; gap:0.5rem;
          background:rgba(255,255,255,0.15); backdrop-filter:blur(8px);
          color:#fff; border:1px solid rgba(255,255,255,0.35);
          border-radius:30px; padding:0.5rem 1.2rem;
          font-size:0.85rem; font-weight:600; cursor:pointer;
          margin-bottom:1.5rem; transition:all 0.2s;
        }
        .reset-btn:hover { background:rgba(255,255,255,0.25); }
      `}</style>

      <div className="lv-bg">
        <div className="lv-page">
          {/* HERO */}
          <div className="hero">
            <div className="hero__eyebrow">
              <span className="hero__dot" />
              AI-Powered Livestock Diagnosis
            </div>
            <div className="hero__title">
              <TextType
                as="h1"
                text={[
                  'Livestock Health Monitor',
                  'Early Disease Detection',
                  'ପଶୁ ସ୍ୱାସ୍ଥ୍ୟ ନିରୀକ୍ଷଣ',
                ]}
                typingSpeed={55}
                deletingSpeed={35}
                pauseDuration={2800}
                initialDelay={400}
                loop={true}
                showCursor={true}
                cursorCharacter="_"
                cursorClassName="hero-cursor"
                cursorBlinkDuration={0.45}
                variableSpeed={{ min: 38, max: 82 }}
              />
            </div>
            <p className="hero__desc">
              Upload a clear photo of your animal. AI will detect diseases and
              give full treatment advice.
            </p>
          </div>

          {/* UPLOAD CARD */}
          {!report && (
            <div className="glass-card">
              <ElectricBorder
                color="#16a34a"
                speed={0.8}
                chaos={0.1}
                borderRadius={14}
                style={{ display: 'block', width: '100%' }}
              >
                <div
                  className="dropzone"
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="dropzone__icon">📷</div>
                  <div className="dropzone__label">
                    Click or drag & drop an animal photo
                  </div>
                  <div className="dropzone__sub">
                    JPG, PNG, WEBP — max 10 MB
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFile(f)
                    }}
                  />
                </div>
              </ElectricBorder>

              {preview && (
                <div className="preview-wrap">
                  <img src={preview} alt="Uploaded animal" />
                </div>
              )}

              {loading && (
                <div className="loader">
                  <div className="spinner" />
                  Analysing your animal photo…
                </div>
              )}

              {error && <div className="error-box">⚠️ {error}</div>}
            </div>
          )}

          {/* RESULT */}
          {report && (
            <div className="result-wrap">
              {/* Reset button */}
              <button
                className="reset-btn"
                onClick={() => {
                  setReport(null)
                  setPreview(null)
                  setError(null)
                }}
              >
                ← Nayi Photo Upload Karein / Analyze Another
              </button>

              {/* Animal Header */}
              <div className="animal-header">
                <div className="animal-emoji">
                  {report.health_status === 'healthy'
                    ? '😊'
                    : report.health_status === 'sick'
                      ? '😟'
                      : '🐄'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="animal-name">{report.animal_identified}</div>
                  <div className="animal-sub">{report.breed_guess}</div>
                  <div className="animal-badges">
                    <span
                      className="badge"
                      style={{
                        background:
                          report.health_status === 'sick'
                            ? '#fef2f2'
                            : '#f0fdf4',
                        borderColor:
                          report.health_status === 'sick'
                            ? '#fca5a5'
                            : '#86efac',
                        color:
                          report.health_status === 'sick'
                            ? '#b91c1c'
                            : '#166534',
                      }}
                    >
                      {report.health_status === 'sick'
                        ? '🤒 Bimar / Sick'
                        : report.health_status === 'healthy'
                          ? '✅ Swasth / Healthy'
                          : '❓ Cannot Determine'}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: '#f3f4f6',
                        borderColor: '#d1d5db',
                        color: '#374151',
                      }}
                    >
                      Confidence: {report.confidence}
                    </span>
                  </div>
                </div>
              </div>

              {/* Urgency Banner */}
              <div
                className="urgency-banner"
                style={{
                  background: urgency.bg,
                  border: `1.5px solid ${urgency.border}`,
                }}
              >
                <div
                  className="urgency-banner__title"
                  style={{ color: urgency.color }}
                >
                  {urgency.icon} {urgency.label}
                </div>
                <div
                  className="urgency-banner__sub"
                  style={{ color: urgency.color }}
                >
                  {report.urgency_reason}
                </div>
              </div>

              {/* Disease */}
              <div className="section-card">
                <div className="section-title">
                  🦠 Suspected Bimari / Disease
                </div>
                <div className="disease-name">{report.disease_suspected}</div>
                <span
                  className="sev-badge"
                  style={{
                    background: sevCfg.bg,
                    color: sevCfg.color,
                    border: `1px solid ${sevCfg.color}33`,
                  }}
                >
                  Severity: {report.severity?.toUpperCase()}
                </span>
              </div>

              {/* Symptoms */}
              {report.symptoms_observed?.length > 0 && (
                <div className="section-card">
                  <div className="section-title">
                    👁️ Dikhne Wale Lakshan / Symptoms Observed
                  </div>
                  <ul className="symptom-list">
                    {report.symptoms_observed.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  {report.body_parts_affected?.map((bp, i) => (
                    <span key={i} className="tag">
                      {bp}
                    </span>
                  ))}
                </div>
              )}

              {/* Home Remedies */}
              {report.gharelu_upchar?.length > 0 && (
                <div className="section-card">
                  <div className="section-title">
                    🌿 Gharelu Upchar / Home Remedies
                  </div>
                  {report.gharelu_upchar.map((r, i) => (
                    <div key={i} className="remedy-card">
                      <div className="remedy-title">
                        #{i + 1} {r.remedy}
                      </div>
                      <div className="remedy-row">
                        <strong>Samagri:</strong> {r.ingredients}
                      </div>
                      <div className="remedy-row">
                        <strong>Banane ka tarika:</strong> {r.preparation}
                      </div>
                      <div className="remedy-row">
                        <strong>Kaise dein:</strong> {r.how_to_use}
                      </div>
                      <div className="remedy-row">
                        <strong>Kitni baar:</strong> {r.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Medicines */}
              {report.veterinary_medicines?.length > 0 && (
                <div className="section-card">
                  <div className="section-title">
                    💊 Veterinary Davaiyaan / Medicines
                  </div>
                  {report.veterinary_medicines.map((m, i) => (
                    <div key={i} className="med-card">
                      <div className="med-header">
                        <div>
                          <div className="med-name">{m.medicine_name}</div>
                          <div className="med-generic">{m.generic_name}</div>
                        </div>
                        {m.price_estimate && (
                          <span className="med-price">
                            Approx {m.price_estimate}
                          </span>
                        )}
                      </div>
                      <div className="med-row">
                        <strong>Dose:</strong> {m.dosage}
                      </div>
                      <div className="med-row">
                        <strong>Route:</strong> {m.route}
                      </div>
                      <div className="med-row">
                        <strong>Frequency:</strong> {m.frequency}
                      </div>
                      <div className="med-row">
                        <strong>Kahan milegi:</strong> {m.where_to_buy}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Diet */}
              <div className="section-card">
                <div className="section-title">
                  🥗 Khaana-Peena / Diet Advice
                </div>
                <div className="diet-box">{report.diet_advice}</div>
                {report.isolation_needed && (
                  <div className="isolation-box">
                    ⚠️ Is pashu ko baki janwaron se alag rakhein / Keep isolated
                    from other animals
                  </div>
                )}
              </div>

              {/* Prevention */}
              {report.prevention_tips?.length > 0 && (
                <div className="section-card">
                  <div className="section-title">
                    🛡️ Bachav ke Tips / Prevention
                  </div>
                  <ul className="prevention-list">
                    {report.prevention_tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Emergency Signs */}
              {report.when_to_call_vet && (
                <div className="section-card">
                  <div className="section-title">
                    🚨 Doctor Ko Kab Bulayein / Emergency Signs
                  </div>
                  <div className="emergency-box">{report.when_to_call_vet}</div>
                </div>
              )}

              {/* Prognosis */}
              {report.prognosis && (
                <div className="section-card">
                  <div className="section-title">
                    📋 Recovery Outlook / Prognosis
                  </div>
                  <div className="prognosis-box">{report.prognosis}</div>
                </div>
              )}

              <div className="disclaimer">
                🐾 Yeh AI-based analysis hai. Gambhir bimari mein hamesha
                qualified veterinary doctor se milein.
                <br />
                This is AI-assisted analysis. Always consult a qualified vet for
                serious conditions.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
