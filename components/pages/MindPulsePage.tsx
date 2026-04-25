'use client'
import { useState, useRef, useEffect } from 'react'
import ResourceFinder from '@/components/ResourceFinder'

type MsgType = 'text' | 'audio'
interface Message {
  id: string
  from: 'bot' | 'user'
  type: MsgType
  text: string
  audioDuration?: number
  time: string
}
interface ChatSession {
  id: string
  title: string
  messages: Message[]
  updatedAt: any
  expiresAt: any
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}
function nowStr() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SYSTEM_PROMPT = `You are Mitra — a warm, caring mental wellness companion for rural farmers in Odisha, India.

  PERSONALITY:
  - You are like a trusted elder brother/sister (bhaiya/didi), NOT a clinical therapist
  - Speak in simple Hindi (Hindustani) mixed with common Odia words
  - Use VERY simple words — no medical jargon, no complicated sentences
  - Be warm, gentle, never judgmental
  - Short replies — 2 to 4 sentences max per message
  - Use emojis occasionally to feel friendly (not excessive)
  - Always respond in the SAME language the user writes in (Hindi, Odia, or English)
  - If user seems very distressed, gently suggest iCall helpline: 9152987821

  ROLE:
  - Listen deeply. Reflect back feelings. Ask gentle follow-up questions.
  - You are a conversation partner, not a questionnaire
  - Never diagnose. Never prescribe. Never give medical advice.
  - Focus on emotional support, coping, hope

  CONTEXT:
  - Users are farmers facing crop failure, debt, loneliness, illness, family stress
  - Many have never talked to anyone about mental health
  - Your job is to make them feel heard and less alone

  START: Begin with a warm greeting and ask how their day was. Keep it very natural.`

async function callGemini(
  history: { role: string; parts: { text: string }[] }[],
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) return 'API key nahi mili.'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents:
          history.length === 0
            ? [{ role: 'user', parts: [{ text: 'Start the conversation' }] }]
            : history,
        generationConfig: { temperature: 0.88, maxOutputTokens: 300 },
      }),
    },
  )
  if (!res.ok) {
    if (res.status === 429)
      return 'Thoda wait karo... abhi bahut log baat kar rahe hain 😅'
    return 'Kuch gadbad ho gayi. Dobara try karo.'
  }
  const data = await res.json()
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    'Kuch samajh nahi aaya, dobara bolna.'
  )
}

let activeMsgId: string | null = null
function ttsPlay(msgId: string, text: string, onEnd: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  activeMsgId = msgId
  const clean = text.replace(/[^\x00-\x7F\u0900-\u097F ]/g, '')
  const utt = new SpeechSynthesisUtterance(clean)
  utt.lang = 'hi-IN'
  utt.rate = 0.88
  utt.pitch = 1.05
  utt.onend = () => {
    activeMsgId = null
    onEnd()
  }
  utt.onerror = () => {
    activeMsgId = null
    onEnd()
  }
  window.speechSynthesis.speak(utt)
}
function ttsPause() {
  window.speechSynthesis?.pause()
}
function ttsStop() {
  activeMsgId = null
  window.speechSynthesis?.cancel()
}

function Waveform({ playing }: { playing: boolean }) {
  const bars = [3, 5, 8, 5, 10, 7, 4, 9, 6, 3, 7, 5, 8, 4, 6]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: h + 2,
            borderRadius: 3,
            background: playing ? '#2d6a4f' : '#a0b8a8',
            animation: playing
              ? `waveBar 0.8s ease-in-out ${(i * 0.07).toFixed(2)}s infinite alternate`
              : 'none',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  )
}

function AudioBubble({
  msg,
  isUser,
  playingId,
  pausedId,
  onPlay,
  onPause,
  onStop,
}: {
  msg: Message
  isUser: boolean
  playingId: string | null
  pausedId: string | null
  onPlay: (id: string, text: string) => void
  onPause: (id: string) => void
  onStop: () => void
}) {
  const isPlaying = playingId === msg.id
  const dur = msg.audioDuration ?? Math.max(3, Math.ceil(msg.text.length / 12))
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.6rem 0.85rem',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? '#d9fdd3' : '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        minWidth: 180,
      }}
    >
      <button
        onClick={() => (isPlaying ? onPause(msg.id) : onPlay(msg.id, msg.text))}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: '#2d6a4f',
          border: 'none',
          color: '#fff',
          fontSize: '0.9rem',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <Waveform playing={isPlaying} />
      <span
        style={{
          fontSize: '0.72rem',
          color: '#6b7c6b',
          marginLeft: 'auto',
          flexShrink: 0,
        }}
      >
        {dur}s
      </span>
    </div>
  )
}

export default function MindPulsePage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [pausedId, setPausedId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [showResourceFinder, setShowResourceFinder] = useState(false)
  const [resourceFinderType, setResourceFinderType] = useState<
    'vet' | 'agri_input' | 'crop_storage'
  >('vet')
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const geminiHistory = useRef<{ role: string; parts: { text: string }[] }[]>(
    [],
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<any>(null)
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const user =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('km_user') || 'null')
      : null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])
  useEffect(() => {
    if (!user?.id) return
    loadSessions()
    cleanupExpired()
  }, [])

  async function loadSessions() {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/chats', { headers: { 'x-uid': user.id } })
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {}
    setSessionsLoading(false)
  }
  async function cleanupExpired() {
    try {
      await fetch('/api/chats/cleanup', {
        method: 'POST',
        headers: { 'x-uid': user.id },
      })
    } catch {}
  }
  async function saveMessages(chatId: string, msgs: Message[]) {
    try {
      await fetch('/api/chats/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-uid': user.id },
        body: JSON.stringify({ chatId, messages: msgs }),
      })
    } catch {}
  }
  async function openSession(session: ChatSession) {
    setActiveChatId(session.id)
    setMessages(session.messages || [])
    geminiHistory.current = (session.messages || []).map((m) => ({
      role: m.from === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))
    setStarted(true)
    setSidebarOpen(false)
  }
  async function deleteSession(id: string) {
    await fetch('/api/chats', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-uid': user.id },
      body: JSON.stringify({ id }),
    })
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeChatId === id) {
      setActiveChatId(null)
      setMessages([])
      setStarted(false)
      geminiHistory.current = []
    }
  }
  function handlePlay(id: string, text: string) {
    ttsStop()
    setPlayingId(id)
    setPausedId(null)
    ttsPlay(id, text, () => {
      setPlayingId(null)
      setPausedId(null)
    })
  }
  function handlePause(id: string) {
    ttsPause()
    setPlayingId(null)
    setPausedId(id)
  }
  function handleStop() {
    ttsStop()
    setPlayingId(null)
    setPausedId(null)
  }

  function requestLocationForResource(
    type: 'vet' | 'agri_input' | 'crop_storage',
  ) {
    setResourceFinderType(type)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
          setShowResourceFinder(true)
        },
        () => alert('Location enable karo aur dobara try karo.'),
      )
    } else {
      alert('Geolocation supported nahi hai.')
    }
  }

  function addMsg(msg: Message) {
    setMessages((prev) => [...prev, msg])
  }

  async function startChat() {
    setStarted(true)
    setLoading(true)
    const greeting = await callGemini([])
    const msg: Message = {
      id: uid(),
      from: 'bot',
      type: 'text',
      text: greeting,
      time: nowStr(),
    }
    geminiHistory.current = [{ role: 'model', parts: [{ text: greeting }] }]
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-uid': user.id },
      body: JSON.stringify({
        title: 'Naya Baat ' + new Date().toLocaleDateString('en-IN'),
      }),
    })
    const data = await res.json()
    setActiveChatId(data.id)
    setMessages([msg])
    await saveMessages(data.id, [msg])
    await loadSessions()
    setLoading(false)
  }

  async function sendText(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading || !activeChatId) return
    setInput('')
    const userMsg: Message = {
      id: uid(),
      from: 'user',
      type: 'text',
      text: trimmed,
      time: nowStr(),
    }
    addMsg(userMsg)
    geminiHistory.current = [
      ...geminiHistory.current,
      { role: 'user', parts: [{ text: trimmed }] },
    ]
    setLoading(true)
    const reply = await callGemini(geminiHistory.current)
    geminiHistory.current = [
      ...geminiHistory.current,
      { role: 'model', parts: [{ text: reply }] },
    ]
    const botMsg: Message = {
      id: uid(),
      from: 'bot',
      type: 'text',
      text: reply,
      time: nowStr(),
    }
    addMsg(botMsg)
    await saveMessages(activeChatId, [userMsg, botMsg])
    setLoading(false)
    inputRef.current?.focus()
  }

  async function sendVoice(transcript: string, durationSecs: number) {
    if (!transcript.trim() || loading || !activeChatId) return
    const userMsg: Message = {
      id: uid(),
      from: 'user',
      type: 'audio',
      text: transcript,
      audioDuration: durationSecs,
      time: nowStr(),
    }
    addMsg(userMsg)
    geminiHistory.current = [
      ...geminiHistory.current,
      { role: 'user', parts: [{ text: transcript }] },
    ]
    setLoading(true)
    const reply = await callGemini(geminiHistory.current)
    geminiHistory.current = [
      ...geminiHistory.current,
      { role: 'model', parts: [{ text: reply }] },
    ]
    const botMsg: Message = {
      id: uid(),
      from: 'bot',
      type: 'text',
      text: reply,
      time: nowStr(),
    }
    addMsg(botMsg)
    await saveMessages(activeChatId, [userMsg, botMsg])
    setLoading(false)
  }

  function startMic() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Aapke phone mein voice nahi chala. Type karein.')
      return
    }
    setRecSeconds(0)
    recTimer.current = setInterval(() => setRecSeconds((s) => s + 1), 1000)
    const rec = new SR()
    rec.lang = 'hi-IN'
    rec.interimResults = false
    recRef.current = rec
    const startedAt = Date.now()
    rec.onstart = () => setListening(true)
    rec.onend = () => {
      setListening(false)
      if (recTimer.current) clearInterval(recTimer.current)
    }
    rec.onerror = () => {
      setListening(false)
      if (recTimer.current) clearInterval(recTimer.current)
    }
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      const dur = Math.round((Date.now() - startedAt) / 1000)
      sendVoice(transcript, Math.max(1, dur))
    }
    rec.start()
  }
  function stopMic() {
    recRef.current?.stop()
    if (recTimer.current) clearInterval(recTimer.current)
    setListening(false)
  }

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f0f4f0',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 272,
          background: '#1b4332',
          color: '#fff',
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: sidebarOpen ? '6px 0 24px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        <div
          style={{
            padding: '1rem 1rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.02em',
            }}
          >
            💬 Purani Baatein
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: 28,
              height: 28,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '0.75rem' }}>
          <button
            onClick={() => {
              setSidebarOpen(false)
              setStarted(false)
              setActiveChatId(null)
              setMessages([])
              geminiHistory.current = []
            }}
            style={{
              width: '100%',
              padding: '0.6rem',
              background: '#2d6a4f',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            + Naya Baat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
          {sessionsLoading ? (
            <p
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.8rem',
                marginTop: '1rem',
              }}
            >
              Load ho raha hai...
            </p>
          ) : sessions.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.8rem',
                marginTop: '1rem',
              }}
            >
              Koi baat nahi mili
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.5rem',
                  borderRadius: 8,
                  marginBottom: 3,
                  background:
                    activeChatId === s.id
                      ? 'rgba(255,255,255,0.12)'
                      : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  onClick={() => openSession(s)}
                  style={{ flex: 1, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 1,
                    }}
                  >
                    {s.messages?.length || 0} messages · 10 din
                  </div>
                </div>
                <button
                  onClick={() => deleteSession(s.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    padding: '4px',
                    borderRadius: 4,
                    opacity: 0.7,
                  }}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
        <div
          style={{
            padding: '0.6rem 0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.68rem',
            color: 'rgba(255,255,255,0.35)',
            textAlign: 'center',
          }}
        >
          Chats 10 din baad auto-delete ho jaate hain
        </div>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 40,
          }}
        />
      )}

      {/* HEADER */}
      <div style={S.header}>
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            width: 36,
            height: 36,
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ☰
        </button>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            🧠
          </div>
          {(loading || listening) && (
            <span
              style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#4ade80',
                border: '2px solid #2d6a4f',
                animation: 'pulse 1.5s infinite',
              }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
            Mitra Bot
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.75)',
              marginTop: 1,
            }}
          >
            {listening
              ? `🔴 Recording... ${recSeconds}s`
              : loading
                ? '✍️ Likh raha hoon...'
                : 'Aapka mann ka dost ❤️'}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '0.18rem 0.5rem',
            borderRadius: 20,
            fontSize: '0.65rem',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          FREE
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={S.chatArea}>
        {!started && (
          <div style={S.introCard}>
            <div style={{ fontSize: '2.8rem', lineHeight: 1 }}>🌿</div>
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#1b4332',
                  margin: '0 0 0.5rem',
                }}
              >
                Mitra Bot
              </h2>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#4b5563',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                Main aapka dost hoon — kuch bhi bol sakte ho.
                <br />
                Koi judge nahi karega. Bas ek sunne wala dost. 🙏
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.45rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {['🎤 Bolo ya likho', '🔊 Suno', '🔒 Private'].map((p) => (
                <span
                  key={p}
                  style={{
                    background: '#f0faf4',
                    border: '1px solid #c8e6d0',
                    borderRadius: 99,
                    padding: '0.28rem 0.7rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#2d6a4f',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>
              Hindi • English • Odia — koi bhi bhasha chalegi
            </p>
            <div
              style={{
                width: '100%',
                borderTop: '1px solid #e8f0e8',
                paddingTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.72rem',
                  color: '#9ca3af',
                  margin: '0 0 0.25rem',
                  textAlign: 'center',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Quick Resources
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.5rem',
                }}
              >
                {[
                  {
                    label: '🐄 Vet',
                    type: 'vet' as const,
                    color: '#d1fae5',
                    border: '#6ee7b7',
                    text: '#065f46',
                  },
                  {
                    label: '🌾 Agri',
                    type: 'agri_input' as const,
                    color: '#fef3c7',
                    border: '#fcd34d',
                    text: '#78350f',
                  },
                  {
                    label: '📦 Store',
                    type: 'crop_storage' as const,
                    color: '#ede9fe',
                    border: '#a78bfa',
                    text: '#5b21b6',
                  },
                ].map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => requestLocationForResource(btn.type)}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: 10,
                      background: btn.color,
                      border: `1.5px solid ${btn.border}`,
                      color: btn.text,
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
            <button style={S.startBtn} onClick={startChat}>
              Baat Karo Mitra Se →
            </button>
          </div>
        )}

        {started && (
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              marginBottom: '0.5rem',
              padding: '0.1rem 0',
            }}
          >
            {[
              {
                label: '🐄 Vet',
                type: 'vet' as const,
                color: '#d1fae5',
                border: '#6ee7b7',
                text: '#065f46',
              },
              {
                label: '🌾 Agri Shop',
                type: 'agri_input' as const,
                color: '#fef3c7',
                border: '#fcd34d',
                text: '#78350f',
              },
              {
                label: '📦 Storage',
                type: 'crop_storage' as const,
                color: '#ede9fe',
                border: '#a78bfa',
                text: '#5b21b6',
              },
            ].map((btn) => (
              <button
                key={btn.type}
                onClick={() => requestLocationForResource(btn.type)}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.2rem',
                  borderRadius: 10,
                  background: btn.color,
                  border: `1.5px solid ${btn.border}`,
                  color: btn.text,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.from === 'user'
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.4rem',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                animation: 'fadeUp 0.2s ease',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#2d6a4f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  🧠
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '78%',
                }}
              >
                {msg.type === 'audio' ? (
                  <AudioBubble
                    msg={msg}
                    isUser={isUser}
                    playingId={playingId}
                    pausedId={pausedId}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onStop={handleStop}
                  />
                ) : (
                  <div style={isUser ? S.userBubble : S.botBubble}>
                    {msg.text.split('\n').map((line, j, arr) => (
                      <span key={j}>
                        {line}
                        {j < arr.length - 1 && <br />}
                      </span>
                    ))}
                    {!isUser && (
                      <button
                        style={{
                          ...S.speakerBtn,
                          background:
                            playingId === msg.id ? '#e8f5e9' : 'transparent',
                        }}
                        onClick={() =>
                          playingId === msg.id
                            ? handlePause(msg.id)
                            : handlePlay(msg.id, msg.text)
                        }
                      >
                        {playingId === msg.id ? '⏸ Roko' : '🔊 Suno'}
                      </button>
                    )}
                  </div>
                )}
                <div style={S.timeStamp}>{msg.time}</div>
              </div>
              {isUser && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#40916c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  👤
                </div>
              )}
            </div>
          )
        })}

        {loading && started && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.4rem',
              justifyContent: 'flex-start',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#2d6a4f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
              }}
            >
              🧠
            </div>
            <div style={{ ...S.botBubble, padding: '0.65rem 0.85rem' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{ ...S.dot, animationDelay: `${i * 0.22}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      {started && (
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #e5ede5',
            flexShrink: 0,
          }}
        >
          {listening ? (
            <div
              style={{
                padding: '0.6rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#fff5f5',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#dc2626',
                  flexShrink: 0,
                  animation: 'recPulse 1s infinite',
                }}
              />
              <span
                style={{
                  fontWeight: 700,
                  color: '#dc2626',
                  fontSize: '0.9rem',
                }}
              >
                Recording... {recSeconds}s
              </span>
              <span
                style={{
                  color: '#9ca3af',
                  fontSize: '0.78rem',
                  marginLeft: 'auto',
                }}
              >
                Chodo = Bhejo
              </span>
              <button
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: '#dc2626',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                onPointerUp={stopMic}
                onPointerLeave={stopMic}
              >
                🔴
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '0.6rem 0.75rem',
                display: 'flex',
                gap: '0.45rem',
                alignItems: 'center',
              }}
            >
              <input
                ref={inputRef}
                style={S.inputField}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendText(input)}
                placeholder="Yahan likho..."
                disabled={loading}
              />
              {input.trim() ? (
                <button
                  style={{ ...S.roundBtn, background: '#2d6a4f' }}
                  onClick={() => sendText(input)}
                  disabled={loading}
                >
                  ➤
                </button>
              ) : (
                <button
                  style={{
                    ...S.roundBtn,
                    background: '#f59e0b',
                    fontSize: '1.2rem',
                  }}
                  onPointerDown={startMic}
                  onPointerUp={stopMic}
                  onPointerLeave={stopMic}
                  disabled={loading}
                  title="Dabake rako aur bolo"
                >
                  🎤
                </button>
              )}
            </div>
          )}
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.65rem',
              color: '#c0c8c0',
              paddingBottom: '0.4rem',
              paddingTop: 0,
            }}
          >
            {input.trim()
              ? 'Enter ya ➤ dabao bhejne ke liye'
              : '🎤 Dabakar bolo → chodo = bhejna'}
          </div>
        </div>
      )}

      {/* Resource Finder Modal */}
      {showResourceFinder && userLocation && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowResourceFinder(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxHeight: '90%', overflowY: 'auto' }}
          >
            <ResourceFinder
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
              resourceType={resourceFinderType}
              onClose={() => setShowResourceFinder(false)}
              farmName="My Farm"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes waveBar { from{transform:scaleY(0.4)} to{transform:scaleY(1.2)} }
        @keyframes recPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
      `}</style>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  header: {
    background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
    color: '#fff',
    padding: '0.65rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem 0.75rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  introCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '1.5rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    border: '1px solid #e8f0e8',
    flex: 1,
    justifyContent: 'center',
    animation: 'fadeUp 0.3s ease',
  },
  startBtn: {
    width: '100%',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '0.85rem',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'background 0.2s',
  },
  botBubble: {
    background: '#fff',
    borderRadius: '4px 16px 16px 16px',
    padding: '0.65rem 0.85rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    fontSize: '0.925rem',
    color: '#1a2e1a',
    lineHeight: 1.65,
    border: '1px solid #f0f0f0',
  },
  userBubble: {
    background: '#dcf8c6',
    borderRadius: '16px 16px 4px 16px',
    padding: '0.65rem 0.85rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    fontSize: '0.925rem',
    color: '#1a2e1a',
    lineHeight: 1.65,
  },
  speakerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    marginTop: '0.4rem',
    border: '1px solid #d0e8d0',
    borderRadius: 8,
    padding: '0.2rem 0.55rem',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#2d6a4f',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  timeStamp: {
    fontSize: '0.64rem',
    color: '#b0bdb0',
    marginTop: '0.2rem',
    paddingLeft: '0.2rem',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#b0bdb0',
    display: 'inline-block',
    animation: 'dotBounce 1s ease-in-out infinite',
  },
  inputField: {
    flex: 1,
    padding: '0.7rem 1rem',
    borderRadius: 24,
    border: '1.5px solid #e0e8e0',
    fontSize: '0.95rem',
    background: '#f8faf8',
    outline: 'none',
    color: '#1a2e1a',
    transition: 'border-color 0.2s',
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s, background 0.2s',
  },
}
