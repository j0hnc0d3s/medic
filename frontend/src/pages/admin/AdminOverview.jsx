// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminOverview.jsx
// CSS  : src/pages/admin/AdminOverview.css
//
// Four stat cards per the mockup:
//   1. Queued — live queue count + how many are critical/high
//      priority (triageLevel 1 / 2), from queueService.getQueue().
//   2. "Minutes" — UNRESOLVED, see the card itself below. Left as
//      an explicit placeholder rather than guessing what it means.
//   3. Total patients + how many were added since yesterday.
//   4. Patients seen today (appointments reaching in-progress) +
//      the same delta vs yesterday.
//
// Below: the current live queue as a dismissible list (client-side
// dismiss only — doesn't touch the actual queue entries).
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { queueService, patientService } from '../../services'
import AdminSidebar from './AdminSidebar'
import './AdminOverview.css'

const ICONS = {
  grid: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  list: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  close: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
}

const dayRange = (daysAgo = 0) => {
  const start = new Date(); start.setDate(start.getDate() - daysAgo); start.setHours(0, 0, 0, 0)
  const end = new Date(start); end.setDate(end.getDate() + 1)
  return { start, end }
}

const deltaLabel = (today, yesterday) => {
  const diff = today - yesterday
  if (diff === 0) return 'same as yesterday'
  return `${diff > 0 ? diff : Math.abs(diff)} ${diff > 0 ? 'up' : 'down'} from yesterday`
}

export default function AdminOverview() {
  const [viewMode, setViewMode] = useState('grid')
  const [loading, setLoading] = useState(true)

  const [queueEntries, setQueueEntries] = useState([])
  const [dismissedIds, setDismissedIds] = useState(new Set())

  const [totalPatients, setTotalPatients] = useState(0)
  const [patientsAddedSinceYesterday, setPatientsAddedSinceYesterday] = useState(0)

  const [seenToday, setSeenToday] = useState(0)
  const [seenYesterday, setSeenYesterday] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Live queue
        const queueRes = await queueService.getQueue()
        if (queueRes.success) setQueueEntries(queueRes.entries || [])

        // Total patients + delta since yesterday
        const patientsRes = await patientService.getPatients()
        if (patientsRes.success) {
          const all = patientsRes.patients || []
          setTotalPatients(all.length)
          const { start } = dayRange(1) // since this time yesterday
          const addedRecently = all.filter(p => {
            const created = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt)
            return !isNaN(created) && created >= start
          })
          setPatientsAddedSinceYesterday(addedRecently.length)
        }

        // Patients seen today vs yesterday (appointments reaching in-progress)
        const today = dayRange(0)
        const yesterday = dayRange(1)
        const [todaySnap, yestSnap] = await Promise.all([
          getDocs(query(collection(db, 'appointments'),
            where('inProgressAt', '>=', Timestamp.fromDate(today.start)),
            where('inProgressAt', '<', Timestamp.fromDate(today.end)))),
          getDocs(query(collection(db, 'appointments'),
            where('inProgressAt', '>=', Timestamp.fromDate(yesterday.start)),
            where('inProgressAt', '<', Timestamp.fromDate(yesterday.end)))),
        ])
        setSeenToday(todaySnap.size)
        setSeenYesterday(yestSnap.size)
      } catch (err) {
        console.error('Failed to load admin overview:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const visibleQueue = queueEntries.filter(e => !dismissedIds.has(e.id))
  const criticalCount = queueEntries.filter(e => e.triageLevel === 1).length
  const highPriorityCount = queueEntries.filter(e => e.triageLevel === 2).length

  const dismiss = (id) => setDismissedIds(prev => new Set(prev).add(id))

  return (
    <div className="no-shell">
      <AdminSidebar />

      <div className="no-main">
        <div className="ao-view-toggle">
          <button className={`ao-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} aria-label="Grid view">
            {ICONS.grid}
          </button>
          <button className={`ao-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} aria-label="List view">
            {ICONS.list}
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</p>
        ) : (
          <>
            <div className="ao-stat-row">
              <div className="ao-stat-card">
                <p className="ao-stat-value">{queueEntries.length}</p>
                <p className="ao-stat-label">queued</p>
                <p className="ao-stat-hint">{criticalCount} critical {highPriorityCount} high priority</p>
              </div>

              {/* Meaning of this metric hasn't been confirmed — left
                  as an explicit placeholder rather than a guess. */}
              <div className="ao-stat-card ao-stat-card--unresolved">
                <p className="ao-stat-value">—</p>
                <p className="ao-stat-label">minutes</p>
                <p className="ao-stat-hint">Not wired up yet — what should this measure?</p>
              </div>

              <div className="ao-stat-card">
                <p className="ao-stat-value">{totalPatients}</p>
                <p className="ao-stat-label">patients</p>
                <p className="ao-stat-hint">{patientsAddedSinceYesterday} from yesterday</p>
              </div>

              <div className="ao-stat-card">
                <p className="ao-stat-value">{seenToday}</p>
                <p className="ao-stat-label">seen today</p>
                <p className="ao-stat-hint">{deltaLabel(seenToday, seenYesterday)}</p>
              </div>
            </div>

            <h2 className="ao-section-title">Live queue</h2>

            {visibleQueue.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Queue is empty.</p>
            ) : (
              <div className="ao-queue-list">
                {visibleQueue.map(e => (
                  <div key={e.id} className="ao-queue-card">
                    <div className="ao-queue-av">{(e.fullName || '?').charAt(0).toUpperCase()}</div>
                    <div className="ao-queue-patient">
                      <p className="ao-queue-name">{e.fullName || 'Unknown'}</p>
                    </div>
                    <div className="ao-queue-reason">
                      <p className="ao-queue-field-label">Reason to visit.</p>
                      <p className="ao-queue-field-value">{e.reason || '—'}</p>
                    </div>
                    <div className="ao-queue-doctor">
                      <p className="ao-queue-field-label">Doctor Assigned</p>
                      <p className="ao-queue-field-value">{e.assignedDoctor || 'Unassigned'}</p>
                    </div>
                    <div className="ao-queue-time">
                      <p className="ao-queue-date">{e.appointmentDate || '—'}</p>
                      <p className="ao-queue-clock">{e.appointmentTime || '—'}</p>
                    </div>
                    <button className="ao-queue-dismiss" onClick={() => dismiss(e.id)} aria-label="Dismiss">
                      {ICONS.close}
                    </button>
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