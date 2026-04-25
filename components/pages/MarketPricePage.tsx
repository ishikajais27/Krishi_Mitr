'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

interface MandiRecord {
  district: string
  market: string
  commodity: string
  variety: string
  arrival_date: string
  min_price: string
  max_price: string
  modal_price: string
}

interface SavedAlert {
  cropApi: string
  cropHindi: string
  cropEmoji: string
  district: string
  phone: string
  lastPrice: number
  lastDate: string
}

const CROPS = [
  { emoji: '🌾', odia: 'ଧାନ', hindi: 'Dhan', api: 'Paddy' },
  { emoji: '🍚', odia: 'ଚାଉଳ', hindi: 'Chawal', api: 'Rice' },
  { emoji: '🥔', odia: 'ଆଳୁ', hindi: 'Aloo', api: 'Potato' },
  { emoji: '🍅', odia: 'ଟମାଟ', hindi: 'Tamatar', api: 'Tomato' },
  { emoji: '🧅', odia: 'ପିଆଜ', hindi: 'Pyaaz', api: 'Onion' },
  { emoji: '🌽', odia: 'ମକା', hindi: 'Makka', api: 'Maize' },
  { emoji: '🌶', odia: 'ଲଙ୍କା', hindi: 'Mirchi', api: 'Green Chilli' },
  { emoji: '🍆', odia: 'ବାଇଗଣ', hindi: 'Baingan', api: 'Brinjal' },
  { emoji: '🥦', odia: 'ଫୁଲକୋବି', hindi: 'Gobhi', api: 'Cauliflower' },
  { emoji: '🥜', odia: 'ଚିନାବାଦାମ', hindi: 'Moongfali', api: 'Groundnut' },
  { emoji: '🌿', odia: 'ସୋରିଷ', hindi: 'Sarson', api: 'Mustard' },
  { emoji: '🍌', odia: 'କଦଳୀ', hindi: 'Kela', api: 'Banana' },
  { emoji: '🥭', odia: 'ଆମ୍ବ', hindi: 'Aam', api: 'Mango' },
]

const UNITS = [
  { label: '250 gm', kg: 0.25 },
  { label: '500 gm', kg: 0.5 },
  { label: '1 Kilo', kg: 1 },
  { label: '2 Kilo', kg: 2 },
  { label: '5 Kilo', kg: 5 },
  { label: '10 Kilo', kg: 10 },
  { label: '20 Kilo', kg: 20 },
  { label: '50 Kilo', kg: 50 },
  { label: '1 Quintal (100 kg)', kg: 100 },
]
const DEFAULT_UNIT_IDX = 2

const DISTRICTS = [
  { name: 'Cuttack', icon: '🏙️', tag: 'Major Mandi' },
  { name: 'Puri', icon: '🛕', tag: 'Coastal' },
  { name: 'Bhubaneswar', icon: '🌆', tag: 'Capital City' },
  { name: 'Sambalpur', icon: '🌊', tag: 'Western Hub' },
  { name: 'Berhampur', icon: '🏪', tag: 'South Hub' },
  { name: 'Balasore', icon: '🌾', tag: 'North Coast' },
  { name: 'Bhadrak', icon: '🌿', tag: 'River Belt' },
  { name: 'Koraput', icon: '⛰️', tag: 'Tribal Belt' },
  { name: 'Rayagada', icon: '🌄', tag: 'Hill District' },
  { name: 'Ganjam', icon: '🏝️', tag: 'South Coast' },
  { name: 'Kendrapara', icon: '🦀', tag: 'Delta Region' },
  { name: 'Jajpur', icon: '🏭', tag: 'Industrial' },
  { name: 'Dhenkanal', icon: '🌳', tag: 'Central' },
  { name: 'Keonjhar', icon: '⛏️', tag: 'Mining Belt' },
  { name: 'Angul', icon: '🔥', tag: 'Industrial' },
  { name: 'Sundargarh', icon: '🏔️', tag: 'Northern' },
  { name: 'Mayurbhanj', icon: '🐯', tag: 'Forest Belt' },
  { name: 'Bargarh', icon: '🌾', tag: 'Rice Bowl' },
  { name: 'Bolangir', icon: '🌻', tag: 'Western' },
]

function priceForUnit(perQuintal: number, kg: number): string {
  const val = (perQuintal / 100) * kg
  if (val < 1) return `${(val * 100).toFixed(0)} paise`
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`
}

function getAdvice(modal: number, allPrices: number[]) {
  if (allPrices.length < 2)
    return {
      emoji: '🟡',
      color: '#78611a',
      bg: '#fdf8e7',
      border: '#c8a832',
      text: 'Thoda Ruko',
      sub: 'Aur mandis ka data nahi mila. Kal dobara check karo.',
    }
  const max = Math.max(...allPrices)
  const min = Math.min(...allPrices)
  const pct = (modal - min) / (max - min || 1)
  if (pct >= 0.65)
    return {
      emoji: '🟢',
      color: '#2d5a27',
      bg: '#eef4e8',
      border: '#6a9e56',
      text: 'ABHI BECHO!',
      sub: 'Aaj bhav bahut achha hai. Jaldi karo.',
    }
  if (pct >= 0.35)
    return {
      emoji: '🟡',
      color: '#78611a',
      bg: '#fdf8e7',
      border: '#c8a832',
      text: 'Thoda Ruko',
      sub: 'Bhav theek hai, par aur upar ja sakta hai.',
    }
  return {
    emoji: '🔴',
    color: '#7a2e2e',
    bg: '#faeeee',
    border: '#c97070',
    text: 'MAT BECHO',
    sub: 'Bhav abhi bahut kam hai. Ruko.',
  }
}

function buildWAMsg(
  crop: (typeof CROPS)[0],
  district: string,
  best: MandiRecord,
  unitLabel: string,
  unitPrice: string,
  advice: ReturnType<typeof getAdvice>,
): string {
  return `🌾 *KrishiMitra — Aaj ka Mandi Bhav*\n\nFasal: ${crop.emoji} ${crop.hindi} (${crop.odia})\nDistrict: 📍 ${district}\nMandi: 🏪 ${best.market}\n\n💰 *${unitLabel} ka bhav: ${unitPrice}*\n📦 1 Quintal (100kg): ₹${parseFloat(best.modal_price).toLocaleString('en-IN')}\n\n${advice.emoji} *${advice.text}*\n${advice.sub}\n\n📅 ${best.arrival_date} | Agmarknet data\n_KrishiMitra app se bheja gaya_`
}

type Step = 'crop' | 'district' | 'loading' | 'result' | 'alert_setup' | 'error'

export default function MarketPricePage() {
  const [step, setStep] = useState<Step>('crop')
  const [crop, setCrop] = useState<(typeof CROPS)[0] | null>(null)
  const [district, setDistrict] = useState('')
  const [records, setRecords] = useState<MandiRecord[]>([])
  const [errMsg, setErrMsg] = useState('')
  const [unitIdx, setUnitIdx] = useState(DEFAULT_UNIT_IDX)
  const [phone, setPhone] = useState('')
  const [alertSaved, setAlertSaved] = useState(false)
  const [savedAlerts, setSavedAlerts] = useState<SavedAlert[]>([])
  const checkRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('km_alerts')
      if (s) setSavedAlerts(JSON.parse(s))
    } catch {}
  }, [])

  const fetchPrices = useCallback(
    async (c: (typeof CROPS)[0], dist: string) => {
      setStep('loading')
      setRecords([])
      const key = process.env.NEXT_PUBLIC_DATAGOV_API_KEY
      if (!key) {
        setErrMsg('no_key')
        setStep('error')
        return
      }
      try {
        const params = new URLSearchParams({
          'api-key': key,
          format: 'json',
          limit: '50',
          filters: JSON.stringify({
            State: 'Odisha',
            Commodity: c.api,
            District: dist,
          }),
        })
        const res = await fetch(
          `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?${params}`,
        )
        if (res.status === 403) {
          setErrMsg('bad_key')
          setStep('error')
          return
        }
        if (!res.ok) {
          setErrMsg('server')
          setStep('error')
          return
        }
        const data = await res.json()
        const recs: MandiRecord[] = data.records ?? []
        if (!recs.length) {
          setErrMsg('no_data')
          setStep('error')
          return
        }
        recs.sort(
          (a, b) => parseFloat(b.modal_price) - parseFloat(a.modal_price),
        )
        setRecords(recs)
        setStep('result')
      } catch {
        setErrMsg('network')
        setStep('error')
      }
    },
    [],
  )

  function saveAlert() {
    if (!crop || !phone.trim() || phone.length < 10) return
    const best = records[0]
    const alert: SavedAlert = {
      cropApi: crop.api,
      cropHindi: crop.hindi,
      cropEmoji: crop.emoji,
      district,
      phone: phone.trim(),
      lastPrice: parseFloat(best.modal_price),
      lastDate: best.arrival_date,
    }
    const updated = [
      alert,
      ...savedAlerts.filter(
        (a) => !(a.cropApi === crop.api && a.district === district),
      ),
    ]
    setSavedAlerts(updated)
    try {
      localStorage.setItem('km_alerts', JSON.stringify(updated))
    } catch {}
    setAlertSaved(true)
  }

  useEffect(() => {
    if (savedAlerts.length === 0) return
    const key = process.env.NEXT_PUBLIC_DATAGOV_API_KEY
    if (!key) return
    async function checkPrices() {
      for (const alert of savedAlerts) {
        try {
          const params = new URLSearchParams({
            'api-key': key!,
            format: 'json',
            limit: '5',
            filters: JSON.stringify({
              State: 'Odisha',
              Commodity: alert.cropApi,
              District: alert.district,
            }),
          })
          const res = await fetch(
            `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?${params}`,
          )
          if (!res.ok) continue
          const data = await res.json()
          const recs: MandiRecord[] = data.records ?? []
          if (!recs.length) continue
          recs.sort(
            (a, b) => parseFloat(b.modal_price) - parseFloat(a.modal_price),
          )
          const newPrice = parseFloat(recs[0].modal_price)
          const changePct =
            Math.abs((newPrice - alert.lastPrice) / alert.lastPrice) * 100
          if (changePct >= 5) {
            const direction =
              newPrice > alert.lastPrice ? 'BADH GAYA ↑' : 'GIRA GAYA ↓'
            const waMsg = encodeURIComponent(
              `🚨 *KrishiMitra Price Alert!*\n\n${alert.cropEmoji} *${alert.cropHindi}* ka bhav ${direction}!\n\n📍 District: ${alert.district}\n🏪 Mandi: ${recs[0].market}\n\nPehle ka bhav: ₹${alert.lastPrice.toLocaleString('en-IN')}/qtl\n*Aaj ka bhav: ₹${newPrice.toLocaleString('en-IN')}/qtl*\nBadlaav: ${changePct.toFixed(1)}%\n\n📅 ${recs[0].arrival_date}\n_KrishiMitra app se auto-alert_`,
            )
            window.open(
              `https://wa.me/91${alert.phone}?text=${waMsg}`,
              '_blank',
            )
            const updated = savedAlerts.map((a) =>
              a.cropApi === alert.cropApi && a.district === alert.district
                ? { ...a, lastPrice: newPrice, lastDate: recs[0].arrival_date }
                : a,
            )
            setSavedAlerts(updated)
            try {
              localStorage.setItem('km_alerts', JSON.stringify(updated))
            } catch {}
          }
        } catch {}
      }
    }
    checkPrices()
    checkRef.current = setInterval(checkPrices, 6 * 60 * 60 * 1000)
    return () => {
      if (checkRef.current) clearInterval(checkRef.current)
    }
  }, [savedAlerts.length])

  function reset() {
    setStep('crop')
    setCrop(null)
    setDistrict('')
    setRecords([])
    setErrMsg('')
    setAlertSaved(false)
    setPhone('')
  }

  const best = records[0] ?? null
  const allModal = records.map((r) => parseFloat(r.modal_price))
  const advice = best ? getAdvice(parseFloat(best.modal_price), allModal) : null
  const unitObj = UNITS[unitIdx]
  const unitPrice = best
    ? priceForUnit(parseFloat(best.modal_price), unitObj.kg)
    : ''

  // Theme colors matching KrishiMitra nude-green palette
  const theme = {
    bg: '#f2f0e8', // warm cream background
    bgCard: '#faf9f4', // slightly lighter card bg
    bgCardAlt: '#f5f3ea', // alternate card bg
    green: '#2d4a1e', // deep olive dark green (like "KRISHI" text)
    greenMid: '#4a7a35', // mid green
    greenLight: '#6a9e56', // lighter green accent
    greenPale: '#dde8d4', // very pale green for borders
    greenPaleCard: '#eaf0e2', // pale green card tint
    accent: '#a8c060', // yellow-green accent (like ticker bar)
    accentDark: '#7a9a3a', // darker yellow-green
    text: '#2a2a1e', // near-black warm text
    textMid: '#4a4a35', // mid warm text
    textLight: '#7a7a5a', // light warm text
    border: '#cdd9b8', // soft green border
    tickerBg: '#b8d44a', // yellow-green ticker (from image)
    tickerText: '#1a2e08', // dark on ticker
    white: '#faf9f4',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        background: theme.bg,
        position: 'relative' as const,
      }}
    >
      {/* BG image overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: "url('/market.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: `linear-gradient(180deg, rgba(42,58,20,0.45) 0%, rgba(242,240,232,0.88) 38%, ${theme.bg} 100%)`,
        }}
      />

      {/* ── YELLOW-GREEN TICKER BAR matching brand ── */}
      <div
        style={{
          width: '100%',
          height: 44,
          overflow: 'hidden',
          background: `linear-gradient(90deg, ${theme.accentDark}, ${theme.accent} 40%, #c8de58 70%, ${theme.accent})`,
          borderBottom: `1px solid rgba(255,255,255,0.2)`,
          display: 'flex',
          alignItems: 'center',
          position: 'sticky' as const,
          top: 0,
          zIndex: 100,
          boxShadow: '0 3px 18px rgba(168,192,96,0.35)',
        }}
      >
        {step !== 'crop' ? (
          <button
            onClick={reset}
            style={{
              background: 'rgba(0,0,0,0.18)',
              border: `1px solid rgba(255,255,255,0.35)`,
              color: theme.tickerText,
              borderRadius: 10,
              padding: '0.28rem 0.8rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '0.75rem',
              flexShrink: 0,
              whiteSpace: 'nowrap' as const,
            }}
          >
            ← Wapas
          </button>
        ) : (
          <div style={{ width: 80, flexShrink: 0 }} />
        )}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              whiteSpace: 'nowrap' as const,
              animation: 'ticker 28s linear infinite',
              willChange: 'transform',
            }}
          >
            {[0, 1].map((n) => (
              <span
                key={n}
                style={{
                  display: 'inline-block',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  color: theme.tickerText,
                  textShadow: '0 1px 3px rgba(255,255,255,0.3)',
                  paddingRight: '2rem',
                }}
              >
                📈 MANDI BHAV &nbsp;•&nbsp; AAJ KA BHAV &nbsp;•&nbsp; ODISHA
                MANDIS &nbsp;•&nbsp; LIVE AGMARKNET DATA &nbsp;•&nbsp; BECHO YA
                RUKO &nbsp;•&nbsp; 19 DISTRICTS &nbsp;•&nbsp; 13 FASLEN
                &nbsp;•&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
        <div style={{ width: 80, flexShrink: 0 }} />
      </div>

      {/* ══════════ STEP 1: CROP ══════════ */}
      {step === 'crop' && (
        <div style={{ position: 'relative', zIndex: 1, paddingBottom: '3rem' }}>
          {/* Hero */}
          <div
            style={{
              padding: '3rem 5vw 2.5rem',
              maxWidth: 860,
              animation: 'fadeUp 0.5s ease both',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: theme.green,
                color: '#e8f0d4',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.35rem 1rem',
                borderRadius: 99,
                letterSpacing: '0.06em',
                marginBottom: '1rem',
              }}
            >
              📡 Live · Agmarknet Data
            </span>
            <h1
              style={{
                fontSize: 'clamp(2.2rem,4.5vw,3.8rem)',
                fontWeight: 900,
                color: theme.green,
                lineHeight: 1.05,
                margin: '0 0 0.75rem',
                letterSpacing: '-0.03em',
              }}
            >
              Aaj ka <span style={{ color: theme.accentDark }}>Mandi Bhav</span>
            </h1>
            <p
              style={{
                fontSize: '1rem',
                color: theme.textMid,
                lineHeight: 1.75,
                margin: '0 0 1.25rem',
                maxWidth: 520,
              }}
            >
              Apni fasal chuniye — real-time price aur{' '}
              <strong style={{ color: theme.accentDark }}>
                "Becho ya Ruko"
              </strong>{' '}
              advice paiye. Bilkul free 🙏
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                flexWrap: 'wrap' as const,
              }}
            >
              {['🏪 19 Districts', '🌾 13 Crops', '✅ Daily Update'].map(
                (p) => (
                  <span
                    key={p}
                    style={{
                      background: theme.bgCard,
                      border: `1.5px solid ${theme.border}`,
                      color: theme.green,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      padding: '0.4rem 1rem',
                      borderRadius: 99,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    {p}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Section heading */}
          <div
            style={{
              textAlign: 'center' as const,
              margin: '0 0 1.5rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <h2
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: theme.green,
                margin: '0 0 0.25rem',
              }}
            >
              🌿 Apni Fasal Chuniye
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: theme.textLight,
                margin: 0,
              }}
            >
              Fasal pe tap karke price dekho
            </p>
          </div>

          {/* Crop grid — fully visible, no overflow clipping */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
              gap: '1rem',
              padding: '0 5vw 1rem',
              maxWidth: 1100,
              margin: '0 auto',
              boxSizing: 'border-box' as const,
            }}
          >
            {CROPS.map((c, i) => (
              <button
                key={c.api}
                onClick={() => {
                  setCrop(c)
                  setStep('district')
                }}
                style={{
                  position: 'relative' as const,
                  background: theme.bgCard,
                  border: `2px solid ${theme.border}`,
                  borderRadius: 20,
                  padding: '1.6rem 0.75rem 1.2rem',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(42,58,20,0.08)',
                  animation: 'fadeUp 0.45s ease both',
                  animationDelay: `${i * 0.04}s`,
                  transition:
                    'transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: 140,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-3px)'
                  el.style.borderColor = theme.greenMid
                  el.style.background = theme.greenPaleCard
                  el.style.boxShadow = '0 8px 24px rgba(42,58,20,0.14)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = ''
                  el.style.borderColor = theme.border
                  el.style.background = theme.bgCard
                  el.style.boxShadow = '0 2px 12px rgba(42,58,20,0.08)'
                }}
              >
                <span
                  style={{
                    position: 'absolute' as const,
                    top: '0.65rem',
                    right: '0.75rem',
                    fontSize: '0.85rem',
                    color: theme.textLight,
                  }}
                >
                  ›
                </span>
                <span
                  style={{
                    fontSize: '3rem',
                    lineHeight: 1,
                    filter: 'drop-shadow(1px 2px 6px rgba(0,0,0,0.1))',
                    marginBottom: '0.2rem',
                  }}
                >
                  {c.emoji}
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: theme.green,
                  }}
                >
                  {c.hindi}
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: theme.textLight,
                    fontWeight: 500,
                  }}
                >
                  {c.odia}
                </span>
              </button>
            ))}
          </div>

          <div
            style={{
              margin: '1rem 5vw 0',
              padding: '1rem 1.4rem',
              background: theme.bgCard,
              border: `1.5px solid ${theme.border}`,
              borderRadius: 16,
              fontSize: '0.9rem',
              color: theme.textMid,
              lineHeight: 1.6,
              maxWidth: 800,
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            }}
          >
            💡 Bechne se pehle local vyapari se bhi poochho — ye wholesale mandi
            ka daam hai.
          </div>
        </div>
      )}

      {/* ══════════ STEP 2: DISTRICT ══════════ */}
      {step === 'district' && crop && (
        <div style={{ position: 'relative', zIndex: 1, paddingBottom: '3rem' }}>
          <div
            style={{
              textAlign: 'center' as const,
              padding: '2.5rem 1.5rem 1.5rem',
              animation: 'fadeUp 0.5s ease both',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: theme.green,
                color: '#e8f0d4',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '0.3rem 1rem',
                borderRadius: 99,
                marginBottom: '0.75rem',
                letterSpacing: '0.04em',
              }}
            >
              {crop.emoji} {crop.hindi} selected
            </span>
            <h1
              style={{
                fontSize: 'clamp(1.8rem,4vw,3rem)',
                fontWeight: 900,
                color: theme.green,
                margin: '0 0 0.4rem',
                letterSpacing: '-0.03em',
              }}
            >
              Apna District Chuniye
            </h1>
            <p
              style={{ fontSize: '0.9rem', color: theme.textLight, margin: 0 }}
            >
              19 districts · Tap karke aaj ka bhav dekho
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.85rem',
              padding: '0 1.5rem',
              maxWidth: 1000,
              margin: '0 auto',
            }}
          >
            {DISTRICTS.map((d, i) => (
              <button
                key={d.name}
                onClick={() => {
                  setDistrict(d.name)
                  fetchPrices(crop, d.name)
                }}
                style={{
                  position: 'relative' as const,
                  background: theme.bgCard,
                  border: `2px solid ${theme.border}`,
                  borderRadius: 18,
                  padding: '1.1rem 1rem 0.9rem',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'flex-start',
                  gap: '0.2rem',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  boxShadow: '0 2px 10px rgba(42,58,20,0.07)',
                  animation: 'fadeUp 0.4s ease both',
                  animationDelay: `${i * 0.03}s`,
                  transition:
                    'transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.borderColor = theme.greenMid
                  el.style.background = theme.greenPaleCard
                  el.style.boxShadow = '0 6px 20px rgba(42,58,20,0.13)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = ''
                  el.style.borderColor = theme.border
                  el.style.background = theme.bgCard
                  el.style.boxShadow = '0 2px 10px rgba(42,58,20,0.07)'
                }}
              >
                <span
                  style={{
                    fontSize: '1.8rem',
                    lineHeight: 1,
                    marginBottom: '0.25rem',
                  }}
                >
                  {d.icon}
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: theme.green,
                  }}
                >
                  {d.name}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: theme.textLight,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                  }}
                >
                  {d.tag}
                </span>
                <span
                  style={{
                    position: 'absolute' as const,
                    top: '0.85rem',
                    right: '0.9rem',
                    fontSize: '0.85rem',
                    color: theme.textLight,
                  }}
                >
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ LOADING ══════════ */}
      {step === 'loading' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '1rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `6px solid ${theme.border}`,
              borderTop: `6px solid ${theme.greenMid}`,
              animation: 'spin 0.85s linear infinite',
            }}
          />
          <p
            style={{
              fontWeight: 700,
              color: theme.green,
              fontSize: '1.1rem',
              margin: 0,
            }}
          >
            Mandi se bhav aa raha hai…
          </p>
          <p style={{ color: theme.textLight, margin: 0 }}>Thoda ruko 🙏</p>
        </div>
      )}

      {/* ══════════ ERROR ══════════ */}
      {step === 'error' && (
        <div
          style={{
            padding: '1rem',
            maxWidth: 480,
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              borderRadius: 20,
              padding: '2rem 1.5rem',
              marginTop: '1rem',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
              textAlign: 'center' as const,
              border: `1.5px solid ${theme.border}`,
            }}
          >
            <div style={{ fontSize: '3rem' }}>
              {errMsg === 'no_key'
                ? '🔑'
                : errMsg === 'bad_key'
                  ? '⚠️'
                  : errMsg === 'no_data'
                    ? '😕'
                    : '📡'}
            </div>
            <p
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: theme.green,
                margin: 0,
              }}
            >
              {errMsg === 'no_key'
                ? 'API Key chahiye'
                : errMsg === 'bad_key'
                  ? 'API Key Galat Hai'
                  : errMsg === 'no_data'
                    ? 'Data Nahi Mila'
                    : 'Internet Error'}
            </p>
            <p
              style={{
                fontSize: '0.95rem',
                color: theme.textMid,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {errMsg === 'no_key' ? (
                <>
                  .env mein <strong>NEXT_PUBLIC_DATAGOV_API_KEY</strong> set
                  karo
                </>
              ) : errMsg === 'bad_key' ? (
                '.env file mein sahi key daalo'
              ) : errMsg === 'no_data' ? (
                `${crop?.hindi} ka ${district} mein aaj data nahi aaya. Kal dobara check karo.`
              ) : (
                'Internet check karo aur dobara try karo.'
              )}
            </p>
            {errMsg === 'no_key' && (
              <a
                href="https://data.gov.in/user/register"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: theme.green,
                  color: '#e8f0d4',
                  padding: '0.85rem 1.5rem',
                  borderRadius: 14,
                  fontSize: '1rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'block',
                  width: '100%',
                  textAlign: 'center' as const,
                }}
              >
                Free Key Lo 👉
              </a>
            )}
            <button
              onClick={reset}
              style={{
                background: theme.bgCard,
                border: `2px solid ${theme.greenMid}`,
                color: theme.greenMid,
                padding: '0.85rem',
                borderRadius: 14,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              ↩ Wapas Jao
            </button>
          </div>
        </div>
      )}

      {/* ══════════ RESULT ══════════ */}
      {step === 'result' && best && crop && advice && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '1.25rem 1.5rem 3rem',
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          {/* Advice banner */}
          <div
            style={{
              background: advice.bg,
              border: `2px solid ${advice.border}`,
              borderRadius: 20,
              padding: '1.25rem 1.5rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              animation: 'fadeUp 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
            }}
          >
            <span style={{ fontSize: '2.8rem', lineHeight: 1, flexShrink: 0 }}>
              {advice.emoji}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: advice.color,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {advice.text}
              </div>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: advice.color,
                  marginTop: '0.25rem',
                  opacity: 0.85,
                }}
              >
                {advice.sub}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: advice.color,
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                📅 {best.arrival_date}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: advice.color,
                  marginTop: '0.2rem',
                  opacity: 0.7,
                }}
              >
                📍 {district}
              </div>
            </div>
          </div>

          {/* Two column grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.25rem',
            }}
          >
            {/* LEFT */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '1rem',
              }}
            >
              {/* Price hero card */}
              <div
                style={{
                  background: theme.bgCard,
                  borderRadius: 22,
                  padding: '1.4rem',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                  border: `1.5px solid ${theme.border}`,
                  animation: 'fadeUp 0.4s 0.05s ease both',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.1rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '2.4rem',
                      filter: 'drop-shadow(1px 2px 6px rgba(0,0,0,0.1))',
                    }}
                  >
                    {crop.emoji}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: theme.green,
                      }}
                    >
                      {crop.hindi}{' '}
                      <span
                        style={{
                          fontWeight: 500,
                          color: theme.textLight,
                          fontSize: '0.85rem',
                        }}
                      >
                        ({crop.odia})
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: theme.textLight,
                        marginTop: '0.12rem',
                      }}
                    >
                      🏪 {best.market}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.6rem',
                    marginBottom: '0.85rem',
                    alignItems: 'end',
                  }}
                >
                  {[
                    {
                      label: '⬇ Kam',
                      val: priceForUnit(parseFloat(best.min_price), unitObj.kg),
                      color: '#7a2e2e',
                      border: '#c97070',
                      bg: '#faeeee',
                    },
                    {
                      label: '✅ Aaj ka',
                      val: unitPrice,
                      color: theme.green,
                      border: theme.greenLight,
                      bg: theme.greenPaleCard,
                      big: true,
                    },
                    {
                      label: '⬆ Zyada',
                      val: priceForUnit(parseFloat(best.max_price), unitObj.kg),
                      color: theme.green,
                      border: theme.border,
                      bg: theme.bgCardAlt,
                    },
                  ].map((p) => (
                    <div
                      key={p.label}
                      style={{
                        background: p.bg,
                        borderRadius: 14,
                        padding: '0.8rem 0.4rem',
                        textAlign: 'center' as const,
                        borderTop: `4px solid ${p.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: theme.textLight,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.05em',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {p.label}
                      </div>
                      <div
                        style={{
                          fontSize: (p as any).big ? '1.7rem' : '1.3rem',
                          fontWeight: 900,
                          color: p.color,
                          lineHeight: 1.1,
                        }}
                      >
                        {p.val}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: theme.textLight,
                          marginTop: '0.2rem',
                          fontWeight: 600,
                        }}
                      >
                        {unitObj.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: theme.textLight,
                    textAlign: 'center' as const,
                    borderTop: `1px solid ${theme.border}`,
                    paddingTop: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  📦 1 Quintal (100kg) = ₹
                  {parseFloat(best.modal_price).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Other mandis */}
              {records.length > 1 && (
                <div
                  style={{
                    background: theme.bgCard,
                    borderRadius: 22,
                    padding: '1.25rem',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    border: `1.5px solid ${theme.border}`,
                    animation: 'fadeUp 0.4s 0.15s ease both',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: theme.green,
                      marginBottom: '0.75rem',
                    }}
                  >
                    🏪 Baaki Mandis
                  </div>
                  {records.slice(0, 6).map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: 12,
                        padding: '0.75rem 0.9rem',
                        marginBottom: '0.4rem',
                        background:
                          i === 0
                            ? theme.greenPaleCard
                            : i % 2 === 0
                              ? theme.bgCardAlt
                              : theme.bgCard,
                        borderLeft: `5px solid ${i === 0 ? theme.greenLight : theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {i === 0 && (
                          <span
                            style={{
                              background: theme.greenMid,
                              color: '#e8f0d4',
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              padding: '0.12rem 0.4rem',
                              borderRadius: 99,
                            }}
                          >
                            BEST
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: theme.green,
                          }}
                        >
                          {r.market}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 900,
                          color: i === 0 ? theme.greenMid : theme.green,
                        }}
                      >
                        {priceForUnit(parseFloat(r.modal_price), unitObj.kg)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '1rem',
              }}
            >
              {/* Unit selector */}
              <div
                style={{
                  background: theme.bgCard,
                  borderRadius: 22,
                  padding: '1.4rem',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  border: `1.5px solid ${theme.border}`,
                  animation: 'fadeUp 0.4s 0.1s ease both',
                }}
              >
                <div
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: theme.green,
                    marginBottom: '1rem',
                  }}
                >
                  🧮 Kitna Bechoge?
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: '0.5rem',
                    marginBottom: '1.1rem',
                  }}
                >
                  {UNITS.map((u, i) => (
                    <button
                      key={i}
                      onClick={() => setUnitIdx(i)}
                      style={{
                        borderRadius: 12,
                        padding: '0.6rem 0.3rem',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        border: `2px solid ${i === unitIdx ? theme.green : theme.border}`,
                        background:
                          i === unitIdx ? theme.green : theme.bgCardAlt,
                        color: i === unitIdx ? '#e8f0d4' : theme.green,
                        fontWeight: i === unitIdx ? 900 : 600,
                        transition: 'all 0.15s',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    background: theme.greenPaleCard,
                    borderRadius: 16,
                    padding: '1.1rem',
                    textAlign: 'center' as const,
                    border: `1.5px solid ${theme.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: theme.textLight,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {unitObj.label} bechoge toh milega
                  </div>
                  <div
                    style={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: theme.green,
                      lineHeight: 1.1,
                      margin: '0.2rem 0',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {unitPrice}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: theme.textLight }}>
                    10 × ={' '}
                    {priceForUnit(
                      parseFloat(best.modal_price),
                      unitObj.kg * 10,
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: '0.75rem',
                }}
              >
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(buildWAMsg(crop, district, best, unitObj.label, unitPrice, advice))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    background: '#25d366',
                    color: '#fff',
                    padding: '1rem',
                    borderRadius: 16,
                    fontSize: '1rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(37,211,102,0.22)',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>💬</span> WhatsApp pe
                  bhejo
                </a>
                <button
                  onClick={() => setStep('alert_setup')}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: theme.bgCard,
                    border: `2px solid ${theme.accentDark}`,
                    color: theme.accentDark,
                    borderRadius: 16,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  🔔 Auto Alert Lagao
                </button>
                <div
                  style={{
                    background: '#f7f5e8',
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: 14,
                    padding: '0.85rem 1rem',
                    fontSize: '0.875rem',
                    color: theme.textMid,
                    lineHeight: 1.6,
                  }}
                >
                  💡 Bechne se pehle local vyapari se bhi poochho — ye wholesale
                  daam hai.
                </div>
                <button
                  onClick={reset}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: theme.green,
                    color: '#e8f0d4',
                    border: 'none',
                    borderRadius: 16,
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px rgba(42,58,20,0.2)`,
                  }}
                >
                  🔄 Doosri Fasal Dekho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ALERT SETUP ══════════ */}
      {step === 'alert_setup' && crop && (
        <div
          style={{
            padding: '1rem',
            maxWidth: 480,
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              borderRadius: 20,
              padding: '1.75rem 1.25rem',
              marginTop: '0.5rem',
              boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: '1rem',
              border: `1.5px solid ${theme.border}`,
            }}
          >
            <div style={{ fontSize: '3rem', textAlign: 'center' as const }}>
              🔔
            </div>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: theme.green,
                margin: 0,
              }}
            >
              Auto Alert Lagao
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: theme.textMid,
                lineHeight: 1.7,
                textAlign: 'center' as const,
                margin: 0,
              }}
            >
              Jab bhi <strong>{crop.hindi}</strong> ka bhav {district} mein 5%
              se zyada upar ya neeche jaye, hum aapko WhatsApp pe turant
              batayenge.
            </p>
            <div style={{ width: '100%' }}>
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: theme.green,
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                Aapka WhatsApp Number
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `2px solid ${theme.border}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    background: theme.greenPaleCard,
                    padding: '0.8rem 0.75rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: theme.green,
                    borderRight: `2px solid ${theme.border}`,
                    flexShrink: 0,
                  }}
                >
                  +91
                </span>
                <input
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    fontSize: '1.1rem',
                    border: 'none',
                    outline: 'none',
                    color: theme.green,
                    background: theme.bgCard,
                  }}
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            {alertSaved ? (
              <div
                style={{
                  background: theme.greenPaleCard,
                  border: `2px solid ${theme.greenLight}`,
                  borderRadius: 14,
                  padding: '1rem',
                  textAlign: 'center' as const,
                  fontWeight: 700,
                  color: theme.green,
                  lineHeight: 1.6,
                  width: '100%',
                }}
              >
                ✅ Alert set ho gaya!
                <br />
                <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>
                  Jab {crop.hindi} ka bhav 5%+ badlega, tab WhatsApp pe message
                  ayega.
                </span>
              </div>
            ) : (
              <button
                onClick={saveAlert}
                disabled={phone.length !== 10}
                style={{
                  background: theme.green,
                  color: '#e8f0d4',
                  padding: '0.85rem 1.5rem',
                  borderRadius: 14,
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: phone.length === 10 ? 'pointer' : 'not-allowed',
                  opacity: phone.length === 10 ? 1 : 0.5,
                  border: 'none',
                  width: '100%',
                }}
              >
                🔔 Alert Set Karo
              </button>
            )}
            {savedAlerts.length > 0 && (
              <div style={{ width: '100%', marginTop: '0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: theme.textLight,
                    textTransform: 'uppercase' as const,
                    marginBottom: '0.5rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  Active Alerts
                </div>
                {savedAlerts.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: theme.greenPaleCard,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      padding: '0.65rem 0.85rem',
                      marginBottom: '0.4rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: theme.green,
                    }}
                  >
                    <span>
                      {a.cropEmoji} {a.cropHindi} — {a.district}
                    </span>
                    <button
                      onClick={() => {
                        const updated = savedAlerts.filter((_, j) => j !== i)
                        setSavedAlerts(updated)
                        try {
                          localStorage.setItem(
                            'km_alerts',
                            JSON.stringify(updated),
                          )
                        } catch {}
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#7a2e2e',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setStep('result')}
              style={{
                background: theme.bgCard,
                border: `2px solid ${theme.greenMid}`,
                color: theme.greenMid,
                padding: '0.85rem',
                borderRadius: 14,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              ← Wapas Jao
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (max-width: 700px) {
          .result-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
