// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseAppointments.jsx
// CSS  : src/pages/staff/NurseAppointments.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import {
  collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy
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
  chevronDown: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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

// Roles that can assign/reassign which doctor an appointment belongs
// to. Doctors work their own assigned list; they don't manage the
// roster. 'head_nurse' isn't wired in yet — see the note where this
// is used below.
const CAN_MANAGE_ASSIGNMENT = ['receptionist', 'nurse', 'admin']

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

  // Doctors see only their own appointments — that's already
  // "professionals only see what's assigned to them" working
  // correctly. Nurses/receptionist/admin need full visibility
  // specifically BECAUSE they're the ones doing the assigning —
  // you can't hand out unassigned appointments you can't see.
  const isDoctor   = userProfile?.role === 'doctor'
  const doctorName = isDoctor
    ? `Dr. ${userProfile.firstName} ${userProfile.lastName}`
    : null

  // TODO: once it's confirmed whether "head nurse" is a distinct
  // role value or a permission flag on 'nurse', add it here.
  const canManageAssignment = CAN_MANAGE_ASSIGNMENT.includes(userProfile?.role)

  // ── Appointments ───────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [appointments, setAppointments]       = useState([])
  const [doctorsList, setDoctorsList]         = useState([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [filterStatus, setFilterStatus]       = useState('all')
  const [filterDate, setFilterDate]           = useState('all')
  const [modal, setModal]                     = useState(null)
  const [reassigningId, setReassigningId]     = useState(null)

  // ── Calendar ───────────────────────────────────────────
  const [todayAgenda, setTodayAgenda] = useState([])
  const [tasks, setTasks]             = useState([])

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

  // Doctor list for the reassignment control
  useEffect(() => {
    if (!canManageAssignment) return
    getDocs(query(collection(db, 'users'), where('role', '==', 'doctor')))
      .then(snap => setDoctorsList(snap.docs.map(d => {
        const { firstName, lastName } = d.data()
        return `Dr. ${firstName} ${lastName}`
      })))
      .catch(() => setDoctorsList([]))
  }, [canManageAssignment])

  // ── Calendar: agenda for whichever day is selected ─────
  // Previously this only ever fetched "today" once — clicking a
  // different day in the mini calendar did nothing, since nothing
  // outside Calendar.jsx knew the selection had moved.
  const fetchAgendaForDay = async (date) => {
    try {
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
      const dayEnd   = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1)

      const constraints = [
        where('appointmentDate', '>=', Timestamp.fromDate(dayStart)),
        where('appointmentDate', '<',  Timestamp.fromDate(dayEnd)),
      ]
      if (isDoctor) constraints.push(where('doctor', '==', doctorName))
      constraints.push(orderBy('appointmentDate'))

      const snap = await getDocs(query(collection(db, 'appointments'), ...constraints))
      setTodayAgenda(snap.docs.map(d => ({
        id:    d.id,
        time:  d.data().appointmentTime || '—',
        label: `${d.data().patientName} — ${d.data().type || 'Appointment'}`,
      })))
    } catch (err) {
      console.error('Failed to load agenda:', err)
      setTodayAgenda([])
    }
  }

  useEffect(() => {
    if (userProfile?.uid) fetchAgendaForDay(new Date())
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

  const addTask = async (label) => {
    if (!label?.trim() || !userProfile?.uid) return
    const data = {
      userId: userProfile.uid, label: label.trim(),
      completed: false, createdAt: Timestamp.now(),
    }
    try {
      const ref = await addDoc(collection(db, 'tasks'), data)
      setTasks(t => [{ id: ref.id, ...data }, ...t])
    } catch (err) { console.error('Add task error:', err) }
  }

  const completeTask = async taskId => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { completed: true })
      setTasks(t => t.filter(x => x.id !== taskId))
    } catch {
      setTasks(t => t.filter(x => x.id !== taskId))
    }
  }

  const deleteTask = async (taskId) => {
    setTasks(t => t.filter(x => x.id !== taskId))
    try { await deleteDoc(doc(db, 'tasks', taskId)) } catch (err) { console.error('Delete task error:', err) }
  }

  const editTask = async (taskId, newLabel) => {
    setTasks(t => t.map(x => x.id === taskId ? { ...x, label: newLabel } : x))
    try { await updateDoc(doc(db, 'tasks', taskId), { label: newLabel }) } catch (err) { console.error('Edit task error:', err) }
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

  // Reassign which doctor an appointment belongs to — this is the
  // "assign appointments" / "alter who's in the triage" capability,
  // scoped to receptionist/nurse/admin (see CAN_MANAGE_ASSIGNMENT).
  const reassignDoctor = async (appt, newDoctor) => {
    setReassigningId(null)
    if (!newDoctor || newDoctor === appt.doctor) return
    try {
      await appointmentService.updateAppointment(appt.id, {
        doctor: newDoctor,
        updatedBy: `${userProfile.firstName} ${userProfile.lastName}`,
      })
      if (appt.patientId) {
        await notificationService.createNotification({
          title: 'Appointment Reassigned',
          message: `Your appointment on ${formatDate(appt.appointmentDate)} is now with ${newDoctor}.`,
          type: 'appointment',
          userId: appt.patientId,
          metadata: { appointmentId: appt.id },
        })
      }
      loadAppointments()
    } catch (err) {
      console.error('Error reassigning appointment:', err)
    }
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
              <div key={appt.id}
                className={`no-appt-card${canManageAssignment ? ' clickable' : ''}`}
                onClick={() => canManageAssignment && openEdit(appt)}>

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
                    {appt.doctor && !canManageAssignment && (
                      <span className="no-appt-tag">{appt.doctor}</span>
                    )}

                    {/* Reassignment control — only staff who can
                        manage assignment get this; doctors just see
                        the plain tag above instead. */}
                    {appt.doctor && canManageAssignment && (
                      <div className="no-reassign-wrap" onClick={e => e.stopPropagation()}>
                        {reassigningId === appt.id ? (
                          <select
                            className="no-reassign-select"
                            defaultValue={appt.doctor}
                            autoFocus
                            onBlur={() => setReassigningId(null)}
                            onChange={e => reassignDoctor(appt, e.target.value)}
                          >
                            {doctorsList.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : (
                          <button className="no-appt-tag no-reassign-btn"
                            onClick={() => setReassigningId(appt.id)}
                            title="Reassign to a different doctor">
                            {appt.doctor} {ICONS.chevronDown}
                          </button>
                        )}
                      </div>
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
                  <div className="no-appt-status-actions">
                    {appt.status === 'scheduled'   && <button className="no-status-action" onClick={e => { e.stopPropagation(); updateStatus(appt, 'confirmed') }}>Confirm</button>}
                    {appt.status === 'confirmed'   && <button className="no-status-action" onClick={e => { e.stopPropagation(); updateStatus(appt, 'in-progress') }}>Start</button>}
                    {appt.status === 'in-progress' && <button className="no-status-action" onClick={e => { e.stopPropagation(); updateStatus(appt, 'completed') }}>Complete</button>}
                  </div>
                  {/* Edit/Delete are assignment-adjacent (they can change
                      doctor, date, notes, etc.) — same gate as reassignment.
                      Doctors can still update status above, just not
                      restructure or remove the appointment itself. */}
                  {canManageAssignment && (
                    <div className="no-appt-edit-delete">
                      <button className="no-appt-text-btn" onClick={e => { e.stopPropagation(); openEdit(appt) }}>Edit</button>
                      <button className="no-appt-text-btn danger" onClick={e => { e.stopPropagation(); handleDelete(appt.id) }}>Delete</button>
                    </div>
                  )}
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
        viewerUserId={userProfile?.uid}
        dayTasks={tasks.map(t => ({ id: t.id, label: t.label }))}
        dayAgenda={todayAgenda}
        onAddTask={addTask}
        onCompleteTask={completeTask}
        onDeleteTask={deleteTask}
        onEditTask={editTask}
        onDayChange={fetchAgendaForDay}
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