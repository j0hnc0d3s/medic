// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminOverview.jsx
// CSS  : src/pages/admin/AdminOverview.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import Calendar from '../../components/Calendar'
import './AdminOverview.css'

import doctor from '../../assets/images/doctor1.jpeg'

const ICONS = {
  patients: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  hourglass: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  eye: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>,
  thermo: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M10 13.5V4a2 2 0 114 0v9.5a4 4 0 11-4 0z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
}

const CURRENT_USER = { firstName: 'Charlie', lastName: 'Martel', role: 'Administrator', image: doctor, online: true, notifications: true }
const MOCK_TASKS_TODAY = [
  { id: 1, label: 'Review staffing for night shift' },
  { id: 2, label: 'Approve June payroll' },
]
const MOCK_AGENDA_TODAY = [
  { id: 1, time: '10:00 AM', label: 'Department heads sync' },
  { id: 2, time: '2:00 PM', label: 'Budget review' },
]

// NOTE: mock data — wire to real queue/metrics service when available.
const STATS = [
  { key: 'patients', icon: ICONS.patients, value: 78, unit: 'patients recorded', delta: '12 from yesterday', percent: 15 },
  { key: 'minutes',  icon: ICONS.hourglass, value: 660, unit: 'minutes', delta: '120 from yesterday', percent: 18 },
  { key: 'queued',   icon: ICONS.eye, value: 17, unit: 'currently queued', delta: '3 critical, 5 high priority', percent: 18 },
  { key: 'seen',     icon: ICONS.thermo, value: 76, unit: 'seen today', delta: '10 from yesterday', percent: 18 },
]

const QUEUE_ROWS = [
  { id: 'Q-1-02', attendedBy: 'Nurse Jones', doctor: 'Dr. Charlie Martel', incident: 'Stroke', status: 'Resolved', override: true },
  { id: 'Q-1-03', attendedBy: 'Nurse Jones', doctor: 'Dr. Charlie Martel', incident: 'Stroke', status: 'Resolved', override: true },
  { id: 'Q-1-04', attendedBy: 'Nurse Jones', doctor: 'Dr. Maxine Martel', incident: 'Shock', status: 'Resolved', override: true },
  { id: 'Q-1-05', attendedBy: 'Nurse Jones', doctor: 'Dr. Charlie Martel', incident: 'Shock', status: 'In Queue', override: true },
  { id: 'Q-2-06', attendedBy: 'Nurse Jones', doctor: 'Dr. Charlie Martel', incident: 'Severe Hand', status: 'In Queue', override: true },
]

function CircularProgress({ percent, size = 70, stroke = 7, color = '#0066ff', track = '#e2e8f5', label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="ao-donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ao-donut-label">{label ?? `${percent}%`}</span>
    </div>
  )
}

export default function AdminOverview() {
  const [range, setRange] = useState('today')
  const [selectedPatient, setSelectedPatient] = useState(null)

  return (
    <div className="no-shell">
      <AdminSidebar role="admin" onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="ao-grid">
          <div className="ao-stats-col">
            {STATS.map(s => (
              <div key={s.key} className="ao-stat-card">
                <div className="ao-stat-top">
                  <div className="ao-stat-icon">{s.icon}</div>
                  <div className="ao-stat-figures">
                    <p className="ao-stat-value">{s.value}</p>
                    <p className="ao-stat-unit">{s.unit}</p>
                  </div>
                  <CircularProgress percent={s.percent} size={62} stroke={6} />
                </div>
                <p className="ao-stat-delta">↑ <b>{s.delta}</b></p>
              </div>
            ))}
          </div>

          <div className="admin-card ao-queue-card">
            <div className="admin-segment">
              {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month']].map(([key, label]) => (
                <button key={key} className={`admin-segment-btn${range === key ? ' active' : ''}`} onClick={() => setRange(key)}>{label}</button>
              ))}
            </div>

            <div className="ao-table" style={{ marginTop: 24 }}>
              <div className="admin-table-head" style={{ gridTemplateColumns: '1fr 1.4fr 1.6fr 1.6fr' }}>
                <span>Queue ID</span><span>Attended By</span><span>Doctor Assigned</span><span>Incident</span>
              </div>

              {QUEUE_ROWS.map(row => (
                <div key={row.id} className="admin-table-row" style={{ gridTemplateColumns: '1fr 1.4fr 1.6fr 1.6fr' }}>
                  <span style={{ fontWeight: 700 }}>{row.id}</span>
                  <span>{row.attendedBy}</span>
                  <span>{row.doctor}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{row.incident}</p>
                    <span className={`admin-pill ${row.status === 'Resolved' ? 'green' : 'gray'}`} style={{ marginTop: 4, display: 'inline-block' }}>{row.status}</span>
                    {row.override && <p className="ao-override-note">Triage Override Granted</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="ao-summary-row">
              <CircularProgress percent={6} label="6%" />
              <CircularProgress percent={50} label="50%" color="#0066ff" />
              <div className="ao-summary-text">
                <p className="ao-summary-title">Summary for April 6th 2026.</p>
                <p className="ao-summary-body">
                  The results of the reveal that 90% of critical patients were attended to with 10% of customers leaving in shorter times.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}