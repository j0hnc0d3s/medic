// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminOverview.jsx
// CSS  : src/pages/admin/AdminOverview.css
//
// Patient summary for the day:
//   - "Patients seen" = appointments whose status reached
//     'in-progress' today (appointmentService.updateStatus now
//     stamps inProgressAt when that happens).
//   - "Left triage" = queueEntries that reached 'completed' today,
//     via queueService.getHistory() — a different collection/status
//     vocabulary entirely from appointments, see queueService.js.
//   - Per-patient duration (wait/service/total) comes straight back
//     from that same history call, computed server-side from real
//     queuedAt/calledAt/completedAt timestamps.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import queueService from '../../services/queueService'
import AdminSidebar from './AdminSidebar'
import './AdminOverview.css'

const fmtMin = (m) => m == null ? '—' : `${m} min`

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [patientsSeenCount, setPatientsSeenCount] = useState(0)
  const [triageEntries, setTriageEntries] = useState([])
  const [triageSummary, setTriageSummary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1)

        const apptSnap = await getDocs(query(
          collection(db, 'appointments'),
          where('inProgressAt', '>=', Timestamp.fromDate(dayStart)),
          where('inProgressAt', '<', Timestamp.fromDate(dayEnd)),
        ))
        setPatientsSeenCount(apptSnap.size)

        const historyRes = await queueService.getHistory()
        if (historyRes.success) {
          setTriageEntries(historyRes.entries || [])
          setTriageSummary(historyRes.summary || null)
        } else {
          setError(historyRes.error)
        }
      } catch (err) {
        console.error('Failed to load admin overview:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="no-shell">
      <AdminSidebar />

      <div className="no-main">
        <h1 className="ao-title">Today's Summary</h1>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</p>
        ) : (
          <>
            {error && (
              <p className="ao-error">Some data couldn't load: {error}</p>
            )}

            <div className="ao-stat-row">
              <div className="ao-stat-card">
                <p className="ao-stat-value">{patientsSeenCount}</p>
                <p className="ao-stat-label">Patients seen today</p>
                <p className="ao-stat-hint">Appointments that reached "in progress"</p>
              </div>

              <div className="ao-stat-card">
                <p className="ao-stat-value">{triageEntries.length}</p>
                <p className="ao-stat-label">Left triage today</p>
                <p className="ao-stat-hint">Queue entries marked completed</p>
              </div>

              <div className="ao-stat-card">
                <p className="ao-stat-value">{fmtMin(triageSummary?.avgTotalMinutes)}</p>
                <p className="ao-stat-label">Avg. time in system</p>
                <p className="ao-stat-hint">Queued → completed</p>
              </div>
            </div>

            <div className="ao-breakdown-row">
              <div className="ao-mini-stat">
                <span className="ao-mini-label">Avg. wait</span>
                <span className="ao-mini-value">{fmtMin(triageSummary?.avgWaitMinutes)}</span>
                <span className="ao-mini-sub">Queued → called</span>
              </div>
              <div className="ao-mini-stat">
                <span className="ao-mini-label">Avg. service</span>
                <span className="ao-mini-value">{fmtMin(triageSummary?.avgServiceMinutes)}</span>
                <span className="ao-mini-sub">Called → completed</span>
              </div>
            </div>

            <h2 className="ao-section-title">Patients who left triage today</h2>

            {triageEntries.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No completed triage entries yet today.</p>
            ) : (
              <div className="ao-triage-list">
                {triageEntries.map(e => (
                  <div key={e.id} className="ao-triage-row">
                    <div className="ao-triage-patient">
                      <p className="ao-triage-name">{e.fullName || 'Unknown'}</p>
                      <p className="ao-triage-meta">{e.priorityLetter ? `Priority ${e.priorityLetter}` : '—'} · {e.queueNumber || '—'}</p>
                    </div>
                    <div className="ao-triage-durations">
                      <span className="ao-duration-chip">Wait {fmtMin(e.waitMinutes)}</span>
                      <span className="ao-duration-chip">Service {fmtMin(e.serviceMinutes)}</span>
                      <span className="ao-duration-chip ao-duration-chip--total">Total {fmtMin(e.totalMinutes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
