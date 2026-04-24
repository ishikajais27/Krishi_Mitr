'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

/* ── Nav items ── */
const NAV = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/livestock', label: 'Livestock', icon: '🐄' },
  { href: '/crop', label: 'Crop Doctor', icon: '🌾' },
  { href: '/marketprice', label: 'Mandi Bhav', icon: '📈' },
  { href: '/mindpulse', label: 'Mind Pulse', icon: '🧠' },
  { href: '/contact', label: 'Contact', icon: '✉️' },
]

/* ── Logged-in user shape ── */
interface KmUser {
  id: string
  name: string
  username: string
  phone: string
  district: string
}

/* ── Single rotating nav item ── */
function RotatingNavItem({
  href,
  label,
  icon,
  onClick,
}: {
  href: string
  label: string
  icon: string
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '44px',
        overflow: 'hidden',
        textDecoration: 'none',
        padding: '0 2px',
        perspective: '600px',
        cursor: 'pointer',
      }}
    >
      {/* Invisible spacer — keeps link width stable */}
      <span
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          visibility: 'hidden',
          fontSize: '0.875rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        <span>{icon}</span>
        {label}
      </span>

      {/* TOP LAYER — plain text, visible by default, flips UP on hover */}
      <motion.span
        animate={
          hovered
            ? { y: '-120%', rotateX: 70, opacity: 0 }
            : { y: '-50%', rotateX: 0, opacity: 1 }
        }
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#1b4332',
          whiteSpace: 'nowrap',
          transformOrigin: 'bottom center',
          pointerEvents: 'none',
        }}
      >
        {label}
      </motion.span>

      {/* BOTTOM LAYER — icon + text, hidden below, flips IN on hover */}
      <motion.span
        animate={
          hovered
            ? { y: '-50%', rotateX: 0, opacity: 1 }
            : { y: '70%', rotateX: -70, opacity: 0 }
        }
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#2d6a4f',
          whiteSpace: 'nowrap',
          transformOrigin: 'top center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
        {label}
      </motion.span>
    </Link>
  )
}

/* ── User avatar dropdown ── */
function UserMenu({ user, onLogout }: { user: KmUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Get initials from name
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#f0f7f4',
          border: '1.5px solid #2d6a4f',
          borderRadius: '12px',
          padding: '0.3rem 0.85rem 0.3rem 0.4rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#d8ede5')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#f0f7f4')}
      >
        {/* Avatar circle */}
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#2d6a4f',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#1b4332',
            maxWidth: 100,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.name.split(' ')[0]}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#2d6a4f', marginLeft: 2 }}>
          ▼
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#fff',
              border: '1px solid #d8e8d0',
              borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              minWidth: 200,
              zIndex: 200,
              overflow: 'hidden',
            }}
          >
            {/* User info header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid #edf4ef',
                background: '#f7fbf8',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1b4332',
                }}
              >
                {user.name}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7aaa8a' }}>
                📞 {user.phone}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7aaa8a' }}>
                📍 {user.district}
              </p>
            </div>

            {/* Menu items */}
            <DropdownItem
              icon="👤"
              label="My Account"
              onClick={() => {
                setOpen(false)
                router.push('/dashboard')
              }}
            />
            <div style={{ borderTop: '1px solid #edf4ef' }} />
            <DropdownItem
              icon="🚪"
              label="Logout"
              danger
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function DropdownItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: hov ? (danger ? '#fff5f5' : '#f0f7f4') : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        color: danger ? '#c0392b' : '#1b4332',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  )
}

/* ── Header ── */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<KmUser | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Read user from localStorage on mount + when pathname changes (after login redirect)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('km_user')
      setUser(raw ? JSON.parse(raw) : null)
    } catch {
      setUser(null)
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('km_user')
    setUser(null)
    router.push('/')
  }

  return (
    <>
      <style>{`
        .header {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.80);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid #d8e8d0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .header__inner {
          max-width: 1100px; margin: 0 auto; padding: 0 1.5rem;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .header__logo {
          display: flex; align-items: center; gap: 0.5rem;
          text-decoration: none; font-size: 1.25rem; font-weight: 700; color: #1b4332;
        }
        .header__logo span { color: #f4a261; }

        .header__nav { display: flex; align-items: center; gap: 0.35rem; }

        .nav-sep {
          width: 1px; height: 14px;
          background: rgba(27,67,50,0.18);
          flex-shrink: 0;
        }

        .header__actions { display: flex; gap: 0.75rem; align-items: center; }
        .header__menu-btn { display: none; background: none; border: none; cursor: pointer; color: #1a2e1a; font-size: 1.5rem; }

        .h-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 1rem; border-radius: 12px; font-size: 0.875rem;
          font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.2s; border: none;
        }
        .h-btn-outline { background: transparent; color: #2d6a4f; border: 1.5px solid #2d6a4f; }
        .h-btn-outline:hover { background: #2d6a4f; color: #fff; }
        .h-btn-primary { background: #2d6a4f; color: #fff; }
        .h-btn-primary:hover { background: #1b4332; }

        @media (max-width: 768px) {
          .header__nav { display: none; }
          .header__nav.open {
            display: flex; flex-direction: column;
            position: absolute; top: 64px; left: 0; right: 0;
            background: rgba(255,255,255,0.97);
            backdrop-filter: blur(18px);
            border-bottom: 1px solid #d8e8d0;
            padding: 1rem 1.5rem; gap: 0.25rem;
          }
          .header__nav.open .nav-sep { display: none; }
          .header__menu-btn { display: block; }
          .h-btn { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
        }
      `}</style>

      <header className="header">
        <div className="header__inner">
          <Link href="/" className="header__logo">
            🌿 Krishi<span>Mitra</span>
          </Link>

          <nav className={`header__nav ${menuOpen ? 'open' : ''}`}>
            {NAV.map((item, i) => (
              <span key={item.href} style={{ display: 'contents' }}>
                <RotatingNavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  onClick={() => setMenuOpen(false)}
                />
                {i < NAV.length - 1 && <span className="nav-sep" />}
              </span>
            ))}
          </nav>

          <div className="header__actions">
            {user ? (
              /* ── Logged in: show avatar dropdown ── */
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              /* ── Logged out: show Login + Sign Up ── */
              <>
                <Link href="/login" className="h-btn h-btn-outline">
                  Login
                </Link>
                <Link href="/signup" className="h-btn h-btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="header__menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>
    </>
  )
}
