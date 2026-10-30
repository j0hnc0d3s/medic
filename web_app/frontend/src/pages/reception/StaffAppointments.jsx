// ─────────────────────────────────────────────────────────
// FILE : src/pages/reception/StaffAppointments.jsx
// CSS  : src/pages/staff/NurseAppointments.css (reused directly)
//
// Receptionist's appointments page: view/book appointments (reuses
// the existing appointmentService + AppointmentFormModal exactly
// like NurseAppointments.jsx does -- new backend or form code would
// just duplicate what's already working), plus a "Doctor
// availability" panel so the front desk can see a doctor's booked
// slots for a day before offering a time to a patient.
//
// Booking here also calls appointmentService.checkConflicts() before
// creating the appointment and blocks on an exact doctor+date+time
// collision. That's a small preview of the "block double-booking"
// rule planned for the scheduling phase -- scoped to this one new
// booking flow so it doesn't touch NurseAppointments' existing one.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import appointmentService from '../../services/appointmentService'
import notificationService from '../../services/notificationService'
import StaffSidebar from './StaffSidebar'
import AppointmentFormModal from '../../components/AppointmentFormModal'
import '../staff/NurseAppointments.css'

const ICONS = {
  calendarAdd: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
}

const STATUS_COLORS = {
  scheduled: '#F59E0B', confirmed: '#3B82F6', 'in-progress': '#2D9C9C',
  completed: '#22C55E', cancelled: '#EF4444', 'no-show': '#6B7280',
}

const STATUS_OPTIONS = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']

const labelize = s => (s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const formatDate = ts => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const todayStr = () => new Date().toISOString().split('T')[0]

export default function StaffAppointments() {
  const { userProfile } = useAuth()
  const location = useLocation()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [modalInitial, setModalInitial] = useState(null)

  const [doctorsList, setDoctorsList]   = useState([])
  const [availDate, setAvailDate]       = useState(todayStr())
  const [availDoctor, setAvailDoctor]   = useState('')
  const [availAppts, setAvailAppts]     = useState([])
  const [availLoading, setAvailLoading] = useState(false)

  // If StaffPatients sent us here with a patient preselected, open
  // the booking modal straight away.
  useEffect(() => {
    if (location.state?.prefillPatient) {
      setModalInitial(location.state.prefillPatient)
      setModalOpen(true)
    }
  }, [location.state])

  useEffect(() => { loadAppointments() }, [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const res = await appointmentService.getAppointments({ orderBy: 'asc' })
      if (res.success) setAppointments(res.appointments)
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Doctor roster for both the availability picker and (indirectly,
  // via AppointmentFormModal's own identical query) the booking form.
  useEffect(() => {
    getDocs(query(collection(db, 'users'), where('role', '==', 'doctor')))
      .then(snap => {
        const names = snap.docs.map(d => {
          const { firstName, lastName } = d.data()
          return `Dr. ${firstName} ${lastName}`
        })
        setDoctorsList(names)
        if (names.length > 0) setAvailDoctor(names[0])
      })
      .catch(() => setDoctorsList([]))
  }, [])

  useEffect(() => {
    if (!availDoctor) { setAvailAppts([]); return }
    setAvailLoading(true)
    appointmentService.getAppointments({ date: availDate, doctor: availDoctor })
      .then(res => setAvailAppts(res.success ? res.appointments : []))
      .finally(() => setAvailLoading(false))
  }, [availDate, availDoctor])

  const upcoming = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    return appointments
      .filter(a => {
        const d = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : new Date(a.appointmentDate)
        return d >= now && a.status !== 'cancelled'
      })
      .sort((a, b) => {
        const da = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : new Date(a.appointmentDate)
        const db_ = b.appointmentDate?.toDate ? b.appointmentDate.toDate() : new Date(b.appointmentDate)
        return da - db_
      })
  }, [appointments])

  const CONFLICT_MESSAGES = {
    'double-booked':  (d, t) => `${d} already has an appointment at ${t}. Pick a different time or doctor.`,
    'blocked-date':   (d)    => `${d} has marked this date as unavailable.`,
    'day-off':        (d)    => `${d} isn't scheduled to work that day.`,
    'outside-hours':  (d, t) => `${d} isn't working at ${t} that day — check their Availability tab.`,
  }

  // Marking a no-show (or cancelling) is what frees a slot back up --
  // checkConflicts only treats 'scheduled'/'confirmed' as booked, so
  // the very next booking attempt for that doctor/date/time will go
  // through once this status change lands.
  const handleStatusChange = async (appt, newStatus) => {
    try {
      await appointmentService.updateStatus(appt.id, newStatus)
      loadAppointments()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleSubmit = async (values) => {
    try {
      const conflictCheck = await appointmentService.checkConflicts({
        doctor: values.doctor,
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime,
      })
      if (conflictCheck.success && conflictCheck.hasConflict) {
        const msg = CONFLICT_MESSAGES[conflictCheck.reason]
        alert(msg ? msg(values.doctor, values.appointmentTime) : 'That slot is unavailable.')
        return
      }

      const result = await appointmentService.createAppointment({
        ...values,
        createdBy: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Reception',
      })

      if (result.success && values.patientId) {
        await notificationService.sendAppointmentReminder({
          id: result.appointmentId,
          patientId: values.patientId,
          doctor: values.doctor,
          appointmentTime: values.appointmentTime,
          appointmentDate: values.appointmentDate,
        })
      }

      setModalOpen(false)
      setModalInitial(null)
      loadAppointments()
    } catch (err) {
      console.error('Error booking appointment:', err)
      alert('Failed to book appointment')
    }
  }

  return (
    <div className="no-shell">
      <StaffSidebar />

      <div className="no-main">
        <div className="no-content-header">
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0, flex: 1 }}>
            Appointments
          </h1>
          <button className="no-content-icon-btn" aria-label="Book appointment"
            onClick={() => { setModalInitial(null); setModalOpen(true) }}>
            {ICONS.calendarAdd}
          </button>
        </div>

        {/* ── Doctor availability ──────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, flexShrink: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' }}>Doctor availability</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <select value={availDoctor} onChange={e => setAvailDoctor(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }}>
              {doctorsList.length === 0 && <option value="">No doctors on file</option>}
              {doctorsList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="date" value={availDate} onChange={e => setAvailDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }} />
          </div>
          {availLoading ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Checking…</p>
          ) : availAppts.length === 0 ? (
            <p style={{ color: '#22C55E', fontSize: 13, fontWeight: 600 }}>Open all day — no booked slots yet.</p>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availAppts
                .filter(a => a.status !== 'cancelled')
                .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''))
                .map(a => (
                  <span key={a.id} style={{ fontSize: 12, fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: 20 }}>
                    {a.appointmentTime} · {a.patientName}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* ── Upcoming list ────────────────────────────── */}
        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading appointments…</p>
        ) : (
          <div className="no-patient-list">
            {upcoming.map(a => (
              <div key={a.id} className="no-patient-row">
                <div className="no-patient-row-av no-patient-row-av--initials" style={{ background: '#1F4788' }}>
                  {getInitials(a.patientName)}
                </div>
                <div className="no-patient-row-name">
                  <p className="no-patient-row-name-text">{a.patientName}</p>
                  <p className="no-patient-row-meta">{a.doctor || 'Unassigned'}</p>
                </div>
                <div className="no-patient-row-col">
                  <p className="no-patient-row-col-label">Date</p>
                  <p className="no-patient-row-col-value">{formatDate(a.appointmentDate)}</p>
                </div>
                <div className="no-patient-row-col">
                  <p className="no-patient-row-col-label">Time</p>
                  <p className="no-patient-row-col-value">{a.appointmentTime || '—'}</p>
                </div>
                <div className="no-patient-row-col">
                  <p className="no-patient-row-col-label">Type</p>
                  <p className="no-patient-row-col-value">{a.type || '—'}</p>
                </div>
                <select
                  value={a.status}
                  onChange={e => handleStatusChange(a, e.target.value)}
                  style={{
                    fontSize: 11, fontWeight: 700, color: STATUS_COLORS[a.status] || '#6B7280',
                    border: `1px solid ${STATUS_COLORS[a.status] || '#6B7280'}`, borderRadius: 20,
                    padding: '3px 8px', background: 'transparent', cursor: 'pointer',
                  }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{labelize(s)}</option>)}
                </select>
              </div>
            ))}

            {upcoming.length === 0 && (
              <p className="no-empty-state">
                No upcoming appointments.
              </p>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <AppointmentFormModal
          mode="add"
          initial={modalInitial}
          onSubmit={handleSubmit}
          onClose={() => { setModalOpen(false); setModalInitial(null) }}
        />
      )}
    </div>
  )
}
