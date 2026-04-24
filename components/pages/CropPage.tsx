'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import TextType from '@/components/TextType'
import ElectricBorder from '@/components/ElectricBorder'

type Top3Item = { class: string; confidence: number }

type CropResult = {
  status: string
  predicted_class: string
  odia_name: string
  confidence: number
  severity: 'low' | 'moderate' | 'high' | string
  advice_odia: string
  see_vet: boolean
  low_confidence: boolean
  top3: Top3Item[]
}

const SEVERITY_COLOR: Record<string, string> = {
  low: '#2d6a4f',
  moderate: '#d97706',
  high: '#dc2626',
}
const SEVERITY_BG: Record<string, string> = {
  low: '#ecfdf5',
  moderate: '#fffbeb',
  high: '#fef2f2',
}
const SEVERITY_BORDER: Record<string, string> = {
  low: '#6ee7b7',
  moderate: '#fcd34d',
  high: '#fca5a5',
}

export default function CropPage() {
  const [result, setResult] = useState<CropResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setResult(null)
    setPreview(URL.createObjectURL(file))
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/crop', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Server error ${res.status}: ${txt}`)
      }

      const data: CropResult = await res.json()

      if (data.status !== 'success') {
        throw new Error('Diagnosis failed. Please try a clearer image.')
      }

      setResult(data)
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

  const sev = result?.severity ?? 'low'
  const sevColor = SEVERITY_COLOR[sev] ?? '#2d6a4f'
  const sevBg = SEVERITY_BG[sev] ?? '#ecfdf5'
  const sevBorder = SEVERITY_BORDER[sev] ?? '#6ee7b7'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── FULL-PAGE BACKGROUND ── */
        .bg-scene {
          min-height: 100vh;
          position: relative;
          font-family: 'DM Sans', sans-serif;
          background-image: url('/crop-bg.jpg');
          background-size: cover;
          background-position: center 50%;
          background-attachment: fixed;
        }
        .bg-scene::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(
            155deg,
            rgba(5, 46, 10, 0.55) 0%,
            rgba(20, 83, 30, 0.35) 45%,
            rgba(120, 140, 20, 0.25) 80%,
            rgba(5, 46, 10, 0.58) 100%
          );
          pointer-events: none;
          z-index: 0;
        }
        .bg-scene::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.48) 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── LAYOUT ── */
        .page {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
        }

        .page__back {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255,255,255,0.72);
          text-decoration: none;
          margin-bottom: 2.5rem;
          letter-spacing: 0.02em;
          transition: color 0.2s;
          text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .page__back:hover { color: #bbf7d0; }

        /* ── HERO ── */
        .hero { margin-bottom: 2rem; }

        .hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #bbf7d0;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
          margin-bottom: 0.75rem;
        }
        .hero__eyebrow-dot {
          width: 6px; height: 6px;
          background: #bbf7d0;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #bbf7d0;
        }

        .hero__title-wrap {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.6rem, 5.2vw, 3.5rem);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          white-space: nowrap;
          color: #0a0a0a;
          text-shadow:
            0 0 40px rgba(255,255,255,0.55),
            0 2px 0 rgba(255,255,255,0.9),
            2px 0 0 rgba(255,255,255,0.7),
            -2px 0 0 rgba(255,255,255,0.7),
            0 -2px 0 rgba(255,255,255,0.7),
            0 4px 24px rgba(0,0,0,0.18);
          min-height: 1.2em;
        }
        .hero__title-wrap .hero-cursor {
          color: #16a34a;
          font-weight: 300;
          text-shadow: 0 0 12px rgba(22,163,74,0.8);
        }

        .hero__rule {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .hero__rule-line {
          flex: 1;
          height: 1.5px;
          background: linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.04));
          max-width: 220px;
        }
        .hero__rule-icon { font-size: 1rem; filter: drop-shadow(0 1px 4px rgba(0,0,0,0.4)); }

        .hero__desc {
          color: rgba(255,255,255,0.86);
          font-size: 1rem;
          line-height: 1.65;
          max-width: 560px;
          text-shadow: 0 1px 6px rgba(0,0,0,0.45);
        }

        /* ── TWO-COLUMN GRID ── */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 700px) {
          .main-grid { grid-template-columns: 1fr; }
          .hero__title-wrap { white-space: normal; }
        }

        /* ── GLASS CARD ── */
        .card {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(18px) saturate(1.6);
          -webkit-backdrop-filter: blur(18px) saturate(1.6);
          border: 1px solid rgba(255,255,255,0.65);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.22),
            0 1px 2px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }

        /* ── LEFT PANEL ── */
        .upload-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ── DROPZONE (border handled by ElectricBorder) ── */
        .dropzone {
          border-radius: 14px;
          padding: 2rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          background: rgba(220,252,231,0.4);
          width: 100%;
        }
        .dropzone:hover {
          background: rgba(187,247,208,0.6);
          transform: translateY(-1px);
        }
        .dropzone__icon { font-size: 2.8rem; margin-bottom: 0.5rem; }
        .dropzone__label { font-size: 0.95rem; color: #1b4332; font-weight: 700; margin-bottom: 0.25rem; }
        .dropzone__sub { font-size: 0.8rem; color: #6b7c6b; }

        .preview-wrap {
          border-radius: 12px;
          overflow: hidden;
          max-height: 200px;
          display: flex;
          justify-content: center;
          background: #f0f0f0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
        }
        .preview-wrap img { max-height: 200px; object-fit: contain; width: 100%; }

        .loader {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #1b4332;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .spinner {
          width: 22px; height: 22px;
          border: 3px solid #d8e8d0;
          border-top-color: #2d6a4f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-box {
          background: #fff5f5;
          border: 1px solid #fca5a5;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          color: #b91c1c;
          font-size: 0.9rem;
        }

        /* ── RIGHT: result placeholder ── */
        .result-placeholder {
          border: 2px dashed rgba(45,106,79,0.22);
          border-radius: 20px;
          padding: 3rem 1.5rem;
          text-align: center;
          color: rgba(255,255,255,0.35);
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          min-height: 220px;
          justify-content: center;
        }
        .result-placeholder__icon { font-size: 2.4rem; opacity: 0.4; }

        /* ── RIGHT: result card ── */
        .result-panel {
          animation: slideIn 0.35s ease both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .result {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #b7dfc6;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .result__header {
          background: linear-gradient(135deg, #14532d 0%, #166534 100%);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .result__name {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          text-transform: capitalize;
          font-family: 'Playfair Display', serif;
          line-height: 1.3;
        }
        .result__odia { font-size: 0.88rem; color: #bbf7d0; font-weight: 500; margin-top: 0.1rem; }
        .result__conf {
          font-size: 0.78rem;
          background: rgba(255,255,255,0.18);
          color: #fff;
          border-radius: 20px;
          padding: 0.2rem 0.65rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.25);
          flex-shrink: 0;
        }

        .result__body {
          background: rgba(247,252,249,0.97);
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .badge-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          font-weight: 700;
          border-radius: 20px;
          padding: 0.22rem 0.65rem;
          border: 1px solid;
        }

        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #14532d;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 0.3rem;
        }
        .info-box {
          background: #fff;
          border: 1px solid #d8e8d0;
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          font-size: 0.95rem;
          color: #1a2e1a;
          line-height: 1.6;
        }

        /* top-3 bar chart */
        .top3 { display: flex; flex-direction: column; gap: 0.45rem; }
        .top3-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.8rem;
          color: #3a6b50;
        }
        .top3-item__name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .top3-bar-wrap {
          flex: 2;
          background: #d8e8d0;
          border-radius: 10px;
          height: 7px;
          overflow: hidden;
        }
        .top3-bar {
          height: 100%;
          background: #16a34a;
          border-radius: 10px;
          transition: width 0.5s ease;
        }
        .top3-item__pct { min-width: 3rem; text-align: right; font-weight: 700; }

        .vet-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          background: #fff7ed;
          border: 1px solid #fdba74;
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          font-size: 0.85rem;
          color: #92400e;
          font-weight: 600;
        }
        .low-conf-note {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          font-size: 0.85rem;
          color: #78350f;
        }
      `}</style>

      <div className="bg-scene">
        <div className="page">
          <Link href="/" className="page__back">
            ← Back to Home
          </Link>

          {/* ── HERO ── */}
          <div className="hero">
            <div className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              AI-Powered Diagnosis · Odia Language
            </div>

            <div className="hero__title-wrap">
              <TextType
                as="h1"
                text={[
                  'Crop Disease Doctor',
                  'Leaf & Crop Analysis',
                  'ଫସଲ ରୋଗ ଚିକିତ୍ସକ',
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
                className="!whitespace-nowrap"
              />
            </div>

            <div className="hero__rule">
              <div className="hero__rule-line" />
              <span className="hero__rule-icon">🌾</span>
            </div>

            <p className="hero__desc">
              Upload a photo of the diseased leaf or crop. Get the disease name
              and exact treatment steps instantly in Odia.
            </p>
          </div>

          {/* ── TWO-COLUMN GRID ── */}
          <div className="main-grid">

            {/* LEFT: upload */}
            <div className="card upload-panel">
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
                  <div className="dropzone__icon">🌿</div>
                  <div className="dropzone__label">
                    Click or drag &amp; drop a crop photo
                  </div>
                  <div className="dropzone__sub">JPG, PNG, WEBP — max 10 MB</div>
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
                  <img src={preview} alt="Uploaded crop" />
                </div>
              )}

              {loading && (
                <div className="loader">
                  <div className="spinner" />
                  Analysing your crop image…
                </div>
              )}

              {error && <div className="error-box">⚠️ {error}</div>}
            </div>

            {/* RIGHT: result or placeholder */}
            {result && !loading ? (
              <div className="result-panel">
                <div className="result">
                  <div className="result__header">
                    <div>
                      <div className="result__name">
                        {result.predicted_class.replace(/___/g, ' — ').replace(/_/g, ' ')}
                      </div>
                      <div className="result__odia">{result.odia_name}</div>
                    </div>
                    <div className="result__conf">
                      {result.confidence.toFixed(1)}% confident
                    </div>
                  </div>

                  <div className="result__body">
                    <div className="badge-row">
                      <span
                        className="badge"
                        style={{ color: sevColor, background: sevBg, borderColor: sevBorder }}
                      >
                        🌡 Severity: {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </span>
                      {result.see_vet && (
                        <span
                          className="badge"
                          style={{ color: '#92400e', background: '#fff7ed', borderColor: '#fdba74' }}
                        >
                          👨‍⚕️ Consult Expert
                        </span>
                      )}
                    </div>

                    {result.low_confidence && (
                      <div className="low-conf-note">
                        ⚠️ <span>Low confidence — try a clearer, better-lit photo for more accurate results.</span>
                      </div>
                    )}

                    {result.see_vet && (
                      <div className="vet-warning">
                        👨‍⚕️ <span>This condition may need expert attention. Please consult a local agriculture officer.</span>
                      </div>
                    )}

                    <div>
                      <div className="section-label">Treatment Advice (ଓଡ଼ିଆ)</div>
                      <div className="info-box">{result.advice_odia}</div>
                    </div>

                    {result.top3?.length > 0 && (
                      <div>
                        <div className="section-label">Other Possibilities</div>
                        <div className="top3">
                          {result.top3.map((item, i) => (
                            <div className="top3-item" key={i}>
                              <span className="top3-item__name">
                                {item.class.replace(/___/g, ' — ').replace(/_/g, ' ')}
                              </span>
                              <div className="top3-bar-wrap">
                                <div className="top3-bar" style={{ width: `${item.confidence}%` }} />
                              </div>
                              <span className="top3-item__pct">{item.confidence.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              !loading && (
                <div className="result-placeholder">
                  <span className="result-placeholder__icon">🔬</span>
                  <span>Diagnosis results will appear here</span>
                </div>
              )
            )}

          </div>
        </div>
      </div>
    </>
  )
}