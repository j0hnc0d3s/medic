// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientAppointments.jsx
// CSS  : src/pages/staff/NurseAppointments.css (shared — same .no-appt-* classes)
//
// Read-only — a patient can see their own appointments (status,
// doctor, date/time) but can't edit/reassign/cancel from here.
// That's the same clinical-workflow gate already applied on the
// staff side; a patient has even less reason to touch those fields.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import appointmentService from '../../services/appointmentService'
import PatientSidebar from './PatientSidebar'
import './PatientAppointments.css'

const STATUS_COLORS = {
  scheduled: '#F59E0B', confirmed: '#3B82F6', 'in-progress': '#2D9C9C',
  completed: '#22C55E', cancelled: '#EF4444', 'no-show': '#6B7280',
}

const labelize = s => (s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const formatDate = ts => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PatientAppointments() {
  const { userProfile } = useAuth()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('upcoming')

  useEffect(() => {
    if (!userProfile?.uid) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await appointmentService.getAppointments({ patientId: userProfile.uid })
        if (res.success) setAppointments(res.appointments)
      } catch (err) {
        console.error('Failed to load appointments:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userProfile?.uid])

  const filtered = appointments.filter(a => {
    if (filterDate === 'all') return true
    const d = a.appointmentDate?.toDate?.()
    if (!d) return true
    if (filterDate === 'upcoming') return d >= new Date()
    if (filterDate === 'past') return d < new Date()
    return true
  })

  return (
    <div className="no-shell">
      <PatientSidebar />

      <div className="no-main">
        <div className="no-content-header">
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0, flex: 1 }}>My Appointments</h1>

          <select className="no-content-filter-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading appointments…</p>
        ) : (
          <div className="no-appt-list">
            {filtered.map(appt => (
              <div key={appt.id} className="no-appt-card">
                <div className="no-appt-patient">
                  <p className="no-appt-name">{appt.doctor || 'Doctor TBD'}</p>
                  <p className="no-appt-meta">{appt.type || 'Appointment'}</p>
                </div>

                <div className="no-appt-reason">
                  <p className="no-appt-reason-label">Notes</p>
                  <p className="no-appt-reason-text">{appt.notes || 'No notes'}</p>
                  <div className="no-appt-tags">
                    <span className="no-status-badge"
                      style={{
                        background: `${STATUS_COLORS[appt.status] || '#6B7280'}1f`,
                        color: STATUS_COLORS[appt.status] || '#6B7280',
                      }}>
                      {labelize(appt.status)}
                    </span>
                  </div>
                </div>

                <div className="no-appt-time">
                  <p className="no-appt-date">{formatDate(appt.appointmentDate)}</p>
                  <p className="no-appt-time-value">{appt.appointmentTime}</p>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                No {filterDate === 'all' ? '' : filterDate} appointments found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
