// ─────────────────────────────────────────────────────────
// FILE : src/display/QueueDisplay.jsx
// CSS  : src/display/QueueDisplay.css
//
// Public, unauthenticated lobby/TV screen. Mount at a route like /display
// with NO sidebar/nav wrapper — meant to run full-screen on a physical
// screen in the waiting room, not as a page a logged-in user visits.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import './QueueDisplay.css'
import logo from "../assets/images/logo.png";

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'
const POLL_MS = 8000

const PRIORITY_COLORS = { A: '#ef4444', B: '#f59e0b', C: '#0066ff', D: '#22c55e', E: '#6b7280' }
const PRIORITY_LABELS = { A: 'Critical', B: 'Urgent', C: 'Standard', D: 'Minor', E: 'Non-urgent' }

export default function QueueDisplay() {
  const [nowServing, setNowServing] = useState([])
  const [waiting, setWaiting] = useState([])
  const [clock, setClock] = useState(new Date())
  const [error, setError] = useState('')

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/queue/display`)
        const data = await res.json()
        if (data.success) {
          setNowServing(data.data.nowServing)
          setWaiting(data.data.waiting)
          setError('')
        }
      } catch {
        setError('Connection lost — retrying…')
      }
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="qd-shell">
      <div className="qd-header">
        <div className="qd-logo">
          <span className="qd-logo-dot"><img src={logo} className="qd-logo-icon"/></span>
          <span className="qd-logo-text">Medic</span>
        </div>
        <div className="qd-clock">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      {error && <p className="qd-error">{error}</p>}

      <div className="qd-now-serving">
        <h2 className="qd-section-label">Now Serving</h2>
        <div className="qd-now-serving-grid">
          {nowServing.length === 0 && <p className="qd-empty">No one currently being seen</p>}
          {nowServing.map((n, i) => (
            <div key={i} className={`qd-now-card${n.status === 'in_progress' ? ' in-progress' : ''}`}>
              <span className="qd-now-id">{n.queueId}</span>
              <span className="qd-now-room">Room {n.room}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="qd-waiting">
        <h2 className="qd-section-label">Waiting</h2>
        <div className="qd-waiting-grid">
          {waiting.length === 0 && <p className="qd-empty">Queue is empty</p>}
          {waiting.map((w, i) => (
            <div key={i} className="qd-waiting-chip" style={{ borderColor: PRIORITY_COLORS[w.priority] || '#6b7280' }}>
              {w.queueId}
            </div>
          ))}
        </div>
      </div>

      <div className="qd-legend">
        {Object.entries(PRIORITY_COLORS).map(([letter, color]) => (
          <span key={letter} className="qd-legend-item">
            <span className="qd-legend-dot" style={{ background: color }} />
            {letter} {PRIORITY_LABELS[letter]}
          </span>
        ))}
      </div>
    </div>
  )
}