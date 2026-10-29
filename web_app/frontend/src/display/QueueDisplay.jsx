// ─────────────────────────────────────────────────────────
// FILE : src/display/QueueDisplay.jsx
// CSS  : src/display/QueueDisplay.css
//
// Public, unauthenticated lobby/TV screen. Mount at a route like /display
// with NO sidebar/nav wrapper — meant to run full-screen on a physical
// screen in the waiting room, not as a page a logged-in user visits.
//
// Redesigned to a light theme: one isolated "now serving" card per
// person currently being seen, then everyone waiting in a flowing
// grid, both colored by triage priority.
//
// NOTE ON NAMES: this renders `n.name` / `w.name` if the API
// provides them, but /api/queue/display currently does NOT send
// names — that's a deliberate choice in queue.py ("no personal info,
// ever" on that route). The mockup this was built from shows names;
// adding them here is only half the change — someone needs to
// consciously decide to add fullName to that backend response too,
// since it changes what's visible on an unauthenticated public
// screen. Until that's done, cards just show the queue ID.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import './QueueDisplay.css'

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'
const POLL_MS = 8000

const PRIORITY_COLORS = { A: '#ef4444', B: '#f59e0b', C: '#0066ff', D: '#22c55e', E: '#6b7280' }
const PRIORITY_LABELS = { A: 'Expedited', B: 'Escalated', C: 'Fast Queue', D: 'Mid Queue', E: 'Slow Queue' }

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
      <div className="qd-bg-shapes" aria-hidden="true">
        <span className="qd-bg-shape qd-bg-shape--1" />
        <span className="qd-bg-shape qd-bg-shape--2" />
      </div>

      <div className="qd-header">
        <h1 className="qd-wordmark">medic</h1>
        <div className="qd-clock">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      {error && <p className="qd-error">{error}</p>}

      <div className="qd-content">
        {nowServing.length > 0 && (
          <div className="qd-now-row">
            {nowServing.map((n, i) => (
              <div key={i} className="qd-card qd-card--now"
                style={{ background: PRIORITY_COLORS[n.priority] || '#ef4444' }}>
                <span className="qd-card-id">{n.queueId}</span>
                {n.name && <span className="qd-card-name">{n.name}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="qd-waiting-grid">
          {waiting.length === 0 && nowServing.length === 0 && (
            <p className="qd-empty">Queue is empty</p>
          )}
          {waiting.map((w, i) => (
            <div key={i} className="qd-card"
              style={{ background: PRIORITY_COLORS[w.priority] || '#6b7280' }}>
              <span className="qd-card-id">{w.queueId}</span>
              {w.name && <span className="qd-card-name">{w.name}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="qd-footer">
        <div className="qd-legend">
          {Object.entries(PRIORITY_COLORS).map(([letter, color]) => (
            <span key={letter} className="qd-legend-item" style={{ background: color }}>
              {letter}, {PRIORITY_LABELS[letter]}
            </span>
          ))}
        </div>
        <span className="qd-watermark">+ Medic</span>
      </div>
    </div>
  )
}