// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientAppointments.jsx
// CSS  : src/pages/patient/PatientAppointments.css
//
// Patients see:
//   1. Appointments from the 'appointments' collection
//      matched by their UID or full name
//   2. Queue entries from 'queueEntries'
//      matched by their email (used in the join form)
// They can cancel upcoming appointments but not edit.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import {
  collection, query, where, getDocs, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import appointmentService from '../../services/appointmentService'
import notificationService from '../../services/notificationService'
import Sidebar from '../staff/NurseSidebar'
import Calendar from '../../components/Calendar'
import './PatientAppointments.css'

import doctorImg from '../../assets/images/doctor1.jpeg'

const STATUS_COLORS = {
  scheduled:    '#F59E0B',
  confirmed:    '#3B82F6',
  'in-progress':'#2D9C9C',
  completed:    '#22C55E',
  cancelled:    '#EF4444',
  'no-show':    '#6B7280',
  queued:       '#8B5CF6',
}

const labelize = s => (s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const formatDate = ts => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Maps a queueEntry into the same display shape as an appointment.
const queueEntryToAppt = entry => ({
  id:              `queue_${entry.id}`,
  _rawId:          entry.id,
  _isQueueEntry:   true,
  patientName:     entry.fullName,
  patientPhone:    entry.phone,
  type:            'Queue Visit',
  doctor:          entry.assignedDoctor || 'To be assigned',
  notes:           entry.reason,
  appointmentDate: entry.queuedAt || entry.createdAt,
  appointmentTime: entry.appointmentTime || '—',
  status:          ({
    pending_verification: 'scheduled',
    queued:       'confirmed',
    called:       'in-progress',
    in_progress:  'in-progress',
    completed:    'completed',
    cancelled:    'cancelled',
    no_show:      'no-show',
  }[entry.status] || 'scheduled'),
  queueNumber:     entry.queueNumber,
  priorityLetter:  entry.priorityLetter,
  cancellable:     false, // queue entries can't be cancelled from here
})

export default function PatientAppointments() {
  const { userProfile } = useAuth()

  const currentUser = useMemo(() => ({
    firstName:    userProfile?.firstName || 'Patient',
    lastName:     userProfile?.lastName  || '',
    role:         'Patient',
    image:        userProfile?.profilePictureUrl || doctorImg,
    online:       true,
    notifications: true,
  }), [userProfile])

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filterDate, setFilterDate]     = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch]             = useState('')
  const [todayAgenda, setTodayAgenda]   = useState([])
  const [tasks, setTasks]               = useState([])

  // ── Load all relevant appointments for this patient ────
  useEffect(() => {
    if (!userProfile?.uid) return
    loadPatientAppointments()
  }, [userProfile?.uid])

  const loadPatientAppointments = async () => {
    setLoading(true)
    try {
      const uid      = userProfile.uid
      const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim()
      const email    = userProfile.email

      const results = []
      const seenIds = new Set()

      // ── 1. Appointments by UID ──────────────────────
      try {
        const byId = await appointmentService.getAppointments({ patientId: uid })
        if (byId.success) {
          byId.appointments.forEach(a => {
            if (!seenIds.has(a.id)) { seenIds.add(a.id); results.push({ ...a, cancellable: true }) }
          })
        }
      } catch { /* silent */ }

      // ── 2. Appointments by name (older records without UID) ──
      try {
        const byName = await getDocs(query(
          collection(db, 'appointments'),
          where('patientName', '==', fullName),
          orderBy('appointmentDate', 'desc')
        ))
        byName.docs.forEach(d => {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id)
            results.push({ id: d.id, ...d.data(), cancellable: true })
          }
        })
      } catch { /* silent — index may not exist yet */ }

      // ── 3. Queue entries by email ──────────────────
      if (email) {
        try {
          const queueSnap = await getDocs(query(
            collection(db, 'queueEntries'),
            where('email', '==', email),
            orderBy('createdAt', 'desc')
          ))
          queueSnap.docs.forEach(d => {
            const mapped = queueEntryToAppt({ id: d.id, ...d.data() })
            if (!seenIds.has(mapped.id)) {
              seenIds.add(mapped.id)
              results.push(mapped)
            }
          })
        } catch { /* silent */ }
      }

      // Sort by date descending (Timestamps first, then fallback)
      results.sort((a, b) => {
        const da = a.appointmentDate?.toDate?.() || new Date(a.appointmentDate || 0)
        const db_ = b.appointmentDate?.toDate?.() || new Date(b.appointmentDate || 0)
        return db_ - da
      })

      setAppointments(results)
    } catch (err) {
      console.error('Error loading patient appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Calendar agenda: patient's upcoming appointments ───
  useEffect(() => {
    if (!userProfile?.uid) return
    const today    = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

    getDocs(query(
      collection(db, 'appointments'),
      where('patientId', '==', userProfile.uid),
      where('appointmentDate', '>=', Timestamp.fromDate(today)),
      where('appointmentDate', '<',  Timestamp.fromDate(tomorrow)),
      orderBy('appointmentDate')
    ))
      .then(snap => setTodayAgenda(snap.docs.map(d => ({
        id:    d.id,
        time:  d.data().appointmentTime || '—',
        label: `${d.data().type || 'Appointment'} — ${d.data().doctor || '—'}`,
      }))))
      .catch(() => setTodayAgenda([]))
  }, [userProfile?.uid])

  // ── Cancel appointment ─────────────────────────────────
  const handleCancel = async appt => {
    if (!appt.cancellable) return
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await appointmentService.cancelAppointment(appt.id, 'Cancelled by patient')

      // Notify patient (themselves) for confirmation
      await notificationService.createNotification({
        title:    'Appointment Cancelled',
        message:  `Your appointment with ${appt.doctor} on ${formatDate(appt.appointmentDate)} has been cancelled.`,
        type:     'appointment',
        userId:   userProfile.uid,
        metadata: { appointmentId: appt.id },
      })

      loadPatientAppointments()
    } catch (err) {
      console.error('Cancel error:', err)
      alert('Failed to cancel appointment')
    }
  }

  // ── Filter ─────────────────────────────────────────────
  const filtered = appointments.filter(a => {
    const matchesSearch = (a.doctor || '').toLowerCase().includes(search.toLowerCase())
                       || (a.type  || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    let   matchesDate   = true

    const d = a.appointmentDate?.toDate?.() || new Date(a.appointmentDate || 0)
    if (filterDate === 'today') {
      matchesDate = d.toDateString() === new Date().toDateString()
    } else if (filterDate === 'upcoming') {
      matchesDate = d >= new Date()
    } else if (filterDate === 'past') {
      matchesDate = d < new Date()
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // ─────────────────────────────────────────────────────

  return (
    <div className="no-shell">
      <NurseSidebar role="patient" onSelectPatient={() => {}} />

      <div className="no-main">
        <div className="no-content-header">
          <input className="no-content-search" placeholder="Search by doctor or type"
            value={search} onChange={e => setSearch(e.target.value)} />

          <select className="no-content-filter-select" value={filterDate}
            onChange={e => setFilterDate(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          <select className="no-content-filter-select" value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s =>
              <option key={s} value={s}>{labelize(s)}</option>)}
          </select>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading your appointments…</p>
        ) : (
          <div className="no-appt-list">
            {filtered.map(appt => (
              <div key={appt.id} className="no-appt-card">
                <div className="no-appt-av-wrap">
                  <div className="no-appt-av-initials">
                    {(appt.doctor || 'DR').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="no-appt-patient">
                  <p className="no-appt-name">{appt.doctor || 'Doctor TBA'}</p>
                  {appt._isQueueEntry && appt.queueNumber && (
                    <p className="no-appt-meta">Queue #{appt.queueNumber}</p>
                  )}
                </div>

                <div className="no-appt-reason">
                  <p className="no-appt-reason-label">{appt.type || 'Appointment'}</p>
                  <p className="no-appt-reason-text">{appt.notes || 'No notes'}</p>
                  <div className="no-appt-tags">
                    {appt._isQueueEntry && (
                      <span className="no-appt-tag" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>
                        Walk-in
                      </span>
                    )}
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

                <div className="no-appt-actions-col">
                  {appt.cancellable &&
                   !['completed', 'cancelled', 'no-show'].includes(appt.status) && (
                    <button className="no-appt-text-btn danger"
                      onClick={() => handleCancel(appt)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: '#9ca3af', fontSize: 13 }}>No appointments found.</p>
                <p style={{ color: '#c4c9d4', fontSize: 12, marginTop: 6 }}>
                  Appointments you book will appear here, including any walk-in queue visits.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Calendar
        currentUser={currentUser}
        dayTasks={tasks}
        dayAgenda={todayAgenda}
      />
    </div>
  )
}