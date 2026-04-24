'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface KmUser {
  id: string
  name: string
  username: string
  phone: string
  district: string
}

const BG =
  'https://i.pinimg.com/736x/61/86/77/618677ac0bdda3b98e1980bf08b5767d.jpg'

function readUser(): KmUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('km_user')
    return raw ? (JSON.parse(raw) as KmUser) : null
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const [user] = useState<KmUser | null>(readUser)
  const router = useRouter()

  useEffect(() => {
    if (!user) router.replace('/login')
  }, [user, router])

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const cards = [
    {
      icon: '🌾',
      label: 'Crop Doctor',
      desc: 'Diagnose crop diseases instantly',
      href: '/crop',
    },
    {
      icon: '🐄',
      label: 'Livestock',
      desc: 'Track your animal health',
      href: '/livestock',
    },
    {
      icon: '📈',
      label: 'Mandi Bhav',
      desc: 'Live market prices near you',
      href: '/marketprice',
    },
    {
      icon: '🧠',
      label: 'Mind Pulse',
      desc: 'Farmer mental wellness check',
      href: '/mindpulse',
    },
    {
      icon: '✉️',
      label: 'Contact',
      desc: 'Get help & support',
      href: '/contact',
    },
    { icon: '🏠', label: 'Home', desc: 'Back to main page', href: '/' },
  ]

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; }
        html {
          background-image: url('${BG}') !important;
          background-size: cover !important;
          background-position: center center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
          background-color: #2d5a3d !important;
        }
        body { background: transparent !important; }
        #__next, [data-nextjs-scroll-focus-boundary], main {
          background: transparent !important;
        }
      `}</style>

      {/* Dark scrim */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background: 'rgba(8,24,14,0.32)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '2.5rem 1.5rem',
          maxWidth: 980,
          margin: '0 auto',
          fontFamily: "'Segoe UI', sans-serif",
          minHeight: '100vh',
        }}
      >
        {/* ── Welcome banner ── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 24,
            padding: '2rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f4a261 0%, #e76f51 100%)',
              color: '#fff',
              fontSize: 26,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 20px rgba(244,162,97,0.5)',
              border: '3px solid rgba(255,255,255,0.35)',
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              ਜੈ ਜਵਾਨ ਜੈ ਕਿਸਾਨ 🙏
            </p>
            <p
              style={{
                margin: '5px 0 0',
                fontSize: 26,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.2,
              }}
            >
              {user.name}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.2rem',
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
                📞 {user.phone}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
                📍 {user.district}, Odisha
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(74,200,120,0.18)',
              border: '1px solid rgba(74,200,120,0.4)',
              borderRadius: 99,
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: 700,
              color: '#7eeaab',
              flexShrink: 0,
            }}
          >
            ✅ Active
          </div>
        </div>

        {/* ── Stats row ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { label: 'District', value: user.district, icon: '📍' },
            { label: 'Phone', value: user.phone, icon: '📞' },
            { label: 'Member Since', value: 'Today', icon: '📅' },
            { label: 'Queries', value: '0', icon: '💬' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.11)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 16,
                padding: '1rem 1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              }}
            >
              <p style={{ margin: 0, fontSize: 22 }}>{stat.icon}</p>
              <p
                style={{
                  margin: '6px 0 2px',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.45)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Quick access ── */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.45)',
            margin: '0 0 0.9rem',
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
          }}
        >
          Quick Access
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {cards.map((card) => (
            <a
              key={card.href}
              href={card.href}
              style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 20,
                padding: '1.5rem',
                textDecoration: 'none',
                display: 'block',
                transition: 'all 0.22s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              }}
              onMouseOver={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = 'translateY(-4px)'
                el.style.background = 'rgba(255,255,255,0.20)'
                el.style.boxShadow = '0 14px 40px rgba(0,0,0,0.25)'
                el.style.borderColor = 'rgba(255,255,255,0.35)'
              }}
              onMouseOut={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = 'translateY(0)'
                el.style.background = 'rgba(255,255,255,0.10)'
                el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'
                el.style.borderColor = 'rgba(255,255,255,0.18)'
              }}
            >
              <p style={{ margin: '0 0 10px', fontSize: 30 }}>{card.icon}</p>
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.52)',
                }}
              >
                {card.desc}
              </p>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
