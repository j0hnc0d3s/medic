// ─────────────────────────────────────────────────────────
// FILE : src/pages/triage/TriageVitals.jsx
// CSS  : src/pages/triage/TriageVitals.css (+ reuses NurseSidebar)
//
// TriageNurse-only page. Shows every active queue entry (reusing
// queueService.getQueue() -- the same staff-only /api/queue route
// NurseOverview/NursePatients already call) alongside its latest
// vitals reading.
//
// No new fetch is needed to get the vitals values themselves: the
// backend's POST /api/vitals/<entryId> route (see
// web_app/backend/app/routes/vitals.py) mirrors every wearable
// reading onto the parent queueEntries/{id} doc as `latestVitals`
// / `latestVitalsAt`, specifically so this kind of "glance at
// everyone's vitals at once" view doesn't need N extra requests.
//
// Each card also links out to the standalone bedside_monitor app
// (a separate deployed app -- see /bedside_monitor in the repo
// root) for the full trend-line view of one patient, via
// VITE_BEDSIDE_MONITOR_URL + "?entry=<id>". If that env var isn't
// set yet (the app hasn't been deployed to its own domain), the
// link renders disabled rather than pointing at a broken URL.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { queueService } from '../../services'
import NurseSidebar from '../staff/NurseSidebar'
import './TriageVitals.css'

const POLL_MS = 5000
const STALE_MS = 15000
const MONITOR_URL = import.meta.env.VITE_BEDSIDE_MONITOR_URL

// Same normal ranges as bedside_monitor/src/App.jsx, kept in sync
// manually since the two apps don't share code.
const RANGES = {
  heartRate:   [50, 110],
  spo2:        [92, 100],
  respRate:    [10, 24],
  tempF:       [96.5, 100.5],
  systolicBP:  [90, 145],
  diastolicBP: [55, 95],
}

function inRange(field, value) {
  if (value == null || !RANGES[field]) return true
  const [lo, hi] = RANGES[field]
  return value >= lo && value <= hi
}

function timeAgo(iso) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return 'just now'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  return `${h}h ago`
}

const STATUS_LABEL = { queued: 'Queued', called: 'Called', in_progress: 'In progress' }

export default function TriageVitals() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastPolled, setLastPolled] = useState(null)

  const load = useCallback(async () => {
    const res = await queueService.getQueue()
    if (res.success) {
      setEntries(res.entries || [])
      setError('')
    } else {
      setError(res.error || 'Failed to load queue')
    }
    setLoading(false)
    setLastPolled(new Date())
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="no-shell">
      <NurseSidebar />

      <div className="no-main">
        <div className="tv-header">
          <div>
            <h1 className="tv-title">Vitals</h1>
            <p className="tv-subtitle">Live wearable readings for everyone currently in the queue.</p>
          </div>
          {lastPolled && (
            <span className="tv-refresh">Updated {timeAgo(lastPolled.toISOString())}</span>
          )}
        </div>

        {loading ? (
          <div className="tv-empty">Loading queue…</div>
        ) : error ? (
          <div className="tv-empty">{error}</div>
        ) : entries.length === 0 ? (
          <div className="tv-empty">No one is currently in the queue.</div>
        ) : (
          <div className="tv-grid">
            {entries.map(entry => {
              const vitals = entry.latestVitals
              const vitalsAt = entry.latestVitalsAt
              const stale = vitalsAt ? (Date.now() - new Date(vitalsAt).getTime() > STALE_MS) : null
              const flagged = vitals
                ? Object.entries(RANGES).some(([field]) => !inRange(field, vitals[field]))
                : false
              const monitorHref = MONITOR_URL ? `${MONITOR_URL}?entry=${entry.id}` : null

              return (
                <div key={entry.id} className={`tv-card${flagged ? ' flagged' : ''}`}>
                  <div className="tv-card-top">
                    <div>
                      <p className="tv-name">{entry.fullName || 'Unnamed patient'}</p>
                      <p className="tv-meta">
                        {entry.priorityLetter ? `Priority ${entry.priorityLetter}` : 'Priority —'}
                        {entry.room ? ` · ${entry.room}` : ''}
                      </p>
                    </div>
                    <span className={`tv-pill ${entry.status}`}>
                      {STATUS_LABEL[entry.status] || entry.status}
                    </span>
                  </div>

                  {!vitals ? (
                    <p className="tv-no-vitals">No vitals received yet for this patient.</p>
                  ) : (
                    <div className="tv-vitals-row">
                      <div className="tv-vital">
                        <div className="tv-vital-label">Heart rate</div>
                        <div className={`tv-vital-value${!inRange('heartRate', vitals.heartRate) ? ' out-of-range' : ''}`}>
                          {vitals.heartRate ?? '—'}<span className="tv-vital-unit">bpm</span>
                        </div>
                      </div>
                      <div className="tv-vital">
                        <div className="tv-vital-label">SpO2</div>
                        <div className={`tv-vital-value${!inRange('spo2', vitals.spo2) ? ' out-of-range' : ''}`}>
                          {vitals.spo2 ?? '—'}<span className="tv-vital-unit">%</span>
                        </div>
                      </div>
                      <div className="tv-vital">
                        <div className="tv-vital-label">Resp. rate</div>
                        <div className={`tv-vital-value${!inRange('respRate', vitals.respRate) ? ' out-of-range' : ''}`}>
                          {vitals.respRate ?? '—'}<span className="tv-vital-unit">br/min</span>
                        </div>
                      </div>
                      <div className="tv-vital">
                        <div className="tv-vital-label">Temp</div>
                        <div className={`tv-vital-value${!inRange('tempF', vitals.tempF) ? ' out-of-range' : ''}`}>
                          {vitals.tempF ?? '—'}<span className="tv-vital-unit">°F</span>
                        </div>
                      </div>
                      <div className="tv-vital">
                        <div className="tv-vital-label">Blood pressure</div>
                        <div className={`tv-vital-value${(!inRange('systolicBP', vitals.systolicBP) || !inRange('diastolicBP', vitals.diastolicBP)) ? ' out-of-range' : ''}`}>
                          {vitals.systolicBP ?? '—'}/{vitals.diastolicBP ?? '—'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="tv-card-footer">
                    {vitalsAt ? (
                      stale ? (
                        <span className="tv-stale">No recent signal</span>
                      ) : (
                        <span className="tv-fresh">Last reading {timeAgo(vitalsAt)}</span>
                      )
                    ) : <span />}

                    <a
                      className={`tv-monitor-link${!monitorHref ? ' disabled' : ''}`}
                      href={monitorHref || undefined}
                      target="_blank"
                      rel="noreferrer"
                      title={monitorHref ? 'Open the full bedside monitor view' : 'Bedside monitor URL not configured yet'}
                    >
                      Open monitor
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
