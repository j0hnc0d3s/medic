// ─────────────────────────────────────────────────────────
// FILE : src/pages/reception/StaffOverview.jsx
// CSS  : src/pages/staff/NurseOverview.css (reused for the shared
//        .no-shell/.no-main frame; the content below is bespoke)
//
// Receptionist's landing page: the live queue (reusing
// queueService.getQueue() -- the same staff-only /api/queue route
// NurseOverview already calls, polled rather than streamed since
// there's no realtime listener on it) with a name search so the
// front desk can tell a waiting patient their position without
// digging through the full board, plus today's appointment count.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo, useCallback } from 'react'
import { queueService, appointmentService } from '../../services'
import StaffSidebar from './StaffSidebar'
import '../staff/NurseOverview.css'

const POLL_MS = 10000

const STATUS_LABEL = { queued: 'Queued', called: 'Called', in_progress: 'In progress' }
const STATUS_COLOR = { queued: '#F59E0B', called: '#3B82F6', in_progress: '#2D9C9C' }

export default function StaffOverview() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [todayCount, setTodayCount] = useState(null)

  const load = useCallback(async () => {
    const res = await queueService.getQueue()
    if (res.success) setEntries(res.entries || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    appointmentService.getTodayAppointments().then(res => {
      if (res.success) setTodayCount(res.appointments.filter(a => a.status !== 'cancelled').length)
    })
  }, [])

  // Queue is already ordered by (triageLevel, queuedAt) server-side,
  // so index + 1 across the active entries is each patient's actual
  // place in line.
  const withPosition = useMemo(() => entries.map((e, i) => ({ ...e, position: i + 1 })), [entries])

  const matches = useMemo(() => {
    if (!search.trim()) return []
    const term = search.toLowerCase()
    return withPosition.filter(e => (e.fullName || '').toLowerCase().includes(term))
  }, [withPosition, search])

  return (
    <div className="no-shell">
      <StaffSidebar />

      <div className="no-main">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Overview</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
          {withPosition.length} people currently in the queue
          {todayCount != null && ` · ${todayCount} appointments today`}
        </p>

        {/* ── Quick lookup: "what's their position?" ───── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, flexShrink: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>
            Look up a patient's position
          </p>
          <input
            placeholder="Type a patient's name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 20, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}
          />
          {search.trim() && (
            <div style={{ marginTop: 12 }}>
              {matches.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af' }}>No one matching "{search}" is currently in the queue.</p>
              ) : matches.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f1f3f5' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.fullName}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    #{m.position} in line · <span style={{ color: STATUS_COLOR[m.status] }}>{STATUS_LABEL[m.status] || m.status}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Full live board ───────────────────────────── */}
        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading queue…</p>
        ) : withPosition.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            No one is currently in the queue.
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
            {withPosition.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #f1f3f5' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1F4788', width: 28 }}>#{e.position}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', flex: 1 }}>{e.fullName || 'Unnamed patient'}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{e.priorityLetter ? `Priority ${e.priorityLetter}` : ''}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[e.status] || '#6B7280' }}>
                  {STATUS_LABEL[e.status] || e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
