// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseAppointments.jsx
// CSS  : src/pages/staff/NurseAppointments.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import {
  collection, query, where, getDocs,
  addDoc, doc, Timestamp, orderBy
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import appointmentService from '../../services/appointmentService'
import notificationService from '../../services/notificationService'
import NurseSidebar from './NurseSidebar'
import Calendar from '../../components/Calendar'
import AppointmentFormModal from '../../components/AppointmentFormModal'
import './NurseAppointments.css'

import doctorImg from '../../assets/images/doctor1.jpeg'

const ICONS = {
  calendarAdd: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
}

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

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export default function NurseAppointments() {
  const { userProfile } = useAuth()

  // ── Current user from auth ─────────────────────────────
  const currentUser = useMemo(() => ({
    firstName:    userProfile?.firstName || 'Staff',
    lastName:     userProfile?.lastName  || '',
    role:         userProfile?.role      || 'Staff',
    image:        userProfile?.profilePictureUrl || doctorImg,
    online:       true,
    notifications: true,
  }), [userProfile])

  // Doctors see only their appointments;
  // nurses/receptionist/admin see everything.
  const isDoctor   = userProfile?.role === 'doctor'
  const doctorName = isDoctor
    ? `Dr. ${userProfile.firstName} ${userProfile.lastName}`
    : null

  // ── Appointments ───────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [appointments, setAppointments]       = useState([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [filterStatus, setFilterStatus]       = useState('all')
  const [filterDate, setFilterDate]           = useState('all')
  const [modal, setModal]                     = useState(null)

  // ── Calendar ───────────────────────────────────────────
  const [todayAgenda, setTodayAgenda] = useState([])
  const [tasks, setTasks]             = useState([])
  const [newTask, setNewTask]         = useState('')

  // ── Load appointments ──────────────────────────────────
  const loadAppointments = async () => {
    setLoading(true)
    try {
      const filters = isDoctor ? { doctor: doctorName } : {}
      const result  = await appointmentService.getAppointments(filters)
      if (result.success) setAppointments(result.appointments)
    } catch (err) {
      console.error('Error loading appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userProfile?.uid) loadAppointments()
  }, [userProfile?.uid])

  // ── Calendar: today's agenda ───────────────────────────
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const today    = new Date(); today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

        const constraints = [
          where('appointmentDate', '>=', Timestamp.fromDate(today)),
          where('appointmentDate', '<',  Timestamp.fromDate(tomorrow)),
          orderBy('appointmentDate'),
        ]
        if (isDoctor) constraints.unshift(where('doctor', '==', doctorName))

        const snap = await getDocs(query(collection(db, 'appointments'), ...constraints))
        setTodayAgenda(snap.docs.map(d => ({
          id:    d.id,
          time:  d.data().appointmentTime || '—',
          label: `${d.data().patientName} — ${d.data().type || 'Appointment'}`,
        })))
      } catch { setTodayAgenda([]) }
    }
    if (userProfile?.uid) fetchToday()
  }, [userProfile?.uid])

  // ── Calendar: tasks ────────────────────────────────────
  useEffect(() => {
    if (!userProfile?.uid) return
    getDocs(query(
      collection(db, 'tasks'),
      where('userId', '==', userProfile.uid),
      where('completed', '==', false),
      orderBy('createdAt', 'desc')
    ))
      .then(snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setTasks([]))
  }, [userProfile?.uid])

  const addTask = async () => {
    if (!newTask.trim() || !userProfile?.uid) return
    const data = {
      userId: userProfile.uid, label: newTask.trim(),
      completed: false, createdAt: Timestamp.now(),
    }
    try {
      const ref = await addDoc(collection(db, 'tasks'), data)
      setTasks(t => [{ id: ref.id, ...data }, ...t])
      setNewTask('')
    } catch (err) { console.error('Add task error:', err) }
  }

  const completeTask = async taskId => {
    const { updateDoc, doc } = await import('firebase/firestore')
    try {
      await updateDoc(doc(db, 'tasks', taskId), { completed: true })
      setTasks(t => t.filter(x => x.id !== taskId))
    } catch {
      setTasks(t => t.filter(x => x.id !== taskId))
    }
  }

  // ── CRUD ───────────────────────────────────────────────
  const openAdd  = () => setModal({ mode: 'add' })
  const openEdit = appt => setModal({
    mode: 'edit',
    record: {
      ...appt,
      appointmentDate: appt.appointmentDate?.toDate?.().toISOString().split('T')[0] || '',
    },
  })

  const handleSubmit = async values => {
    try {
      if (modal.mode === 'edit') {
        await appointmentService.updateAppointment(modal.record.id, {
          ...values,
          updatedBy: `${userProfile.firstName} ${userProfile.lastName}`,
        })
      } else {
        const result = await appointmentService.createAppointment({
          ...values,
          createdBy: `${userProfile.firstName} ${userProfile.lastName}`,
        })

        // Notify patient if they have an account (patientId attached)
        if (result.success && values.patientId) {
          await notificationService.sendAppointmentReminder({
            id:              result.appointmentId,
            patientId:       values.patientId,
            doctor:          values.doctor,
            appointmentTime: values.appointmentTime,
            appointmentDate: values.appointmentDate,
          })
        }
      }
      loadAppointments()
    } catch (err) {
      console.error('Error saving appointment:', err)
      alert('Failed to save appointment')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this appointment?')) return
    try {
      await appointmentService.deleteAppointment(id)
      loadAppointments()
    } catch (err) { console.error('Error deleting appointment:', err) }
  }

  const updateStatus = async (appt, newStatus) => {
    try {
      await appointmentService.updateStatus(appt.id, newStatus)

      // Notify patient on key status changes
      if (appt.patientId && ['confirmed', 'cancelled'].includes(newStatus)) {
        const messages = {
          confirmed:  `Your appointment with ${appt.doctor} on ${formatDate(appt.appointmentDate)} has been confirmed.`,
          cancelled:  `Your appointment with ${appt.doctor} on ${formatDate(appt.appointmentDate)} has been cancelled.`,
        }
        await notificationService.createNotification({
          title:    newStatus === 'confirmed' ? 'Appointment Confirmed' : 'Appointment Cancelled',
          message:  messages[newStatus],
          type:     'appointment',
          userId:   appt.patientId,
          metadata: { appointmentId: appt.id },
        })
      }

      loadAppointments()
    } catch (err) { console.error('Error updating status:', err) }
  }

  // ── Filter ─────────────────────────────────────────────
  const filtered = appointments.filter(a => {
    const matchesSearch = a.patientName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    let   matchesDate   = true

    if (filterDate === 'today') {
      matchesDate = a.appointmentDate?.toDate?.().toDateString() === new Date().toDateString()
    } else if (filterDate === 'upcoming') {
      matchesDate = a.appointmentDate?.toDate?.() >= new Date()
    } else if (filterDate === 'past') {
      matchesDate = a.appointmentDate?.toDate?.() < new Date()
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // ─────────────────────────────────────────────────────

  return (
    <div className="no-shell">
      <NurseSidebar onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="no-content-header">
          <input className="no-content-search" placeholder="Search by patient"
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

          <button className="no-content-icon-btn" aria-label="New appointment"
            onClick={openAdd}>
            {ICONS.calendarAdd}
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading appointments…</p>
        ) : (
          <div className="no-appt-list">
            {filtered.map(appt => (
              <div key={appt.id} className="no-appt-card">

                {/* Avatar — initials when no photo */}
                <div className="no-appt-av-wrap">
                  {appt.patientPhoto ? (
                    <img src={appt.patientPhoto} className="no-appt-av" alt="" />
                  ) : (
                    <div className="no-appt-av-initials">
                      {getInitials(appt.patientName)}
                    </div>
                  )}
                </div>

                <div className="no-appt-patient">
                  <p className="no-appt-name">{appt.patientName}</p>
                  <p className="no-appt-meta">{appt.patientPhone || '—'}</p>
                </div>

                <div className="no-appt-reason">
                  <p className="no-appt-reason-label">{appt.type || 'Appointment'}</p>
                  <p className="no-appt-reason-text">{appt.notes || 'No notes'}</p>
                  <div className="no-appt-tags">
                    {appt.doctor && <span className="no-appt-tag">{appt.doctor}</span>}
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
                  <div className="no-appt-status-actions">
                    {appt.status === 'scheduled'   && <button className="no-status-action" onClick={() => updateStatus(appt, 'confirmed')}>Confirm</button>}
                    {appt.status === 'confirmed'   && <button className="no-status-action" onClick={() => updateStatus(appt, 'in-progress')}>Start</button>}
                    {appt.status === 'in-progress' && <button className="no-status-action" onClick={() => updateStatus(appt, 'completed')}>Complete</button>}
                  </div>
                  <div className="no-appt-edit-delete">
                    <button className="no-appt-text-btn" onClick={() => openEdit(appt)}>Edit</button>
                    <button className="no-appt-text-btn danger" onClick={() => handleDelete(appt.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                {isDoctor
                  ? `No appointments found for ${doctorName}.`
                  : 'No appointments found.'}
              </p>
            )}
          </div>
        )}
      </div>

      <Calendar
        currentUser={currentUser}
        dayTasks={tasks.map(t => ({ id: t.id, label: t.label }))}
        dayAgenda={todayAgenda}
        onAddTask={addTask}
        onCompleteTask={completeTask}
        newTaskValue={newTask}
        onNewTaskChange={setNewTask}
      />

      {modal && (
        <AppointmentFormModal
          mode={modal.mode}
          initial={modal.record}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}