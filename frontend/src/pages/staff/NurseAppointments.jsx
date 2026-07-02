// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseAppointments.jsx
// CSS  : src/pages/staff/NurseAppointments.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import NurseSidebar from './NurseSidebar'
import Calendar from '../../components/Calendar'
import AppointmentFormModal from '../../components/AppointmentFormModal'
import './NurseAppointments.css'

import doctorImg from '../../assets/images/doctor1.jpeg'

const ICONS = {
  calendarAdd: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
}

const CURRENT_USER = { firstName: 'Sarah', lastName: 'Johnson', role: 'Registered Nurse', image: doctorImg, online: true, notifications: true }
const MOCK_TASKS_TODAY = [{ id: 1, label: 'Follow up with Martha' }]
const MOCK_AGENDA_TODAY = [{ id: 1, time: '9:00 AM', label: 'H. Evans — General Consultation' }]

const STATUS_COLORS = {
  scheduled: '#F59E0B', confirmed: '#3B82F6', 'in-progress': '#2D9C9C',
  completed: '#22C55E', cancelled: '#EF4444', 'no-show': '#6B7280',
}
const labelize = (s) => (s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NurseAppointments() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [modal, setModal] = useState(null) // { mode, record? }

  useEffect(() => { loadAppointments() }, [])

  const loadAppointments = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'appointments'), orderBy('appointmentDate', 'desc')))
      setAppointments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Error loading appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => setModal({ mode: 'add' })
  const openEdit = (appt) => setModal({
    mode: 'edit',
    record: {
      ...appt,
      appointmentDate: appt.appointmentDate?.toDate().toISOString().split('T')[0] || '',
    },
  })

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        patientName: values.patientName.trim(),
        appointmentDate: Timestamp.fromDate(new Date(values.appointmentDate)),
        updatedAt: Timestamp.now(),
      }

      if (modal.mode === 'edit') {
        await updateDoc(doc(db, 'appointments', modal.record.id), data)
      } else {
        data.createdAt = Timestamp.now()
        await addDoc(collection(db, 'appointments'), data)
      }
      loadAppointments()
    } catch (err) {
      console.error('Error saving appointment:', err)
      alert('Failed to save appointment')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return
    try {
      await deleteDoc(doc(db, 'appointments', id))
      loadAppointments()
    } catch (err) {
      console.error('Error deleting appointment:', err)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus, updatedAt: Timestamp.now() })
      loadAppointments()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const filtered = appointments.filter(a => {
    const matchesSearch = a.patientName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus

    let matchesDate = true
    if (filterDate === 'today') {
      matchesDate = a.appointmentDate?.toDate().toDateString() === new Date().toDateString()
    } else if (filterDate === 'upcoming') {
      matchesDate = a.appointmentDate?.toDate() >= new Date()
    } else if (filterDate === 'past') {
      matchesDate = a.appointmentDate?.toDate() < new Date()
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  return (
    <div className="no-shell">
      <NurseSidebar onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="no-content-header">
          <input className="no-content-search" placeholder="Search by patient" value={search} onChange={e => setSearch(e.target.value)} />

          <select className="no-content-filter-select" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          <select className="no-content-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{labelize(s)}</option>)}
          </select>

          <button className="no-content-icon-btn" aria-label="New appointment" onClick={openAdd}>{ICONS.calendarAdd}</button>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading appointments…</p>
        ) : (
          <div className="no-appt-list">
            {filtered.map(appt => (
              <div key={appt.id} className="no-appt-card">
                <img src={doctorImg} className="no-appt-av" alt="" />

                <div className="no-appt-patient">
                  <p className="no-appt-name">{appt.patientName}</p>
                  <p className="no-appt-meta">{appt.patientPhone || '—'}</p>
                </div>

                <div className="no-appt-reason">
                  <p className="no-appt-reason-label">{appt.type || 'Appointment'}</p>
                  <p className="no-appt-reason-text">{appt.notes || 'No notes'}</p>
                  <div className="no-appt-tags">
                    {appt.doctor && <span className="no-appt-tag">{appt.doctor}</span>}
                    <span className="no-status-badge" style={{ background: `${STATUS_COLORS[appt.status]}1f`, color: STATUS_COLORS[appt.status] }}>
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
                    {appt.status === 'scheduled' && <button className="no-status-action" onClick={() => updateStatus(appt.id, 'confirmed')}>Confirm</button>}
                    {appt.status === 'confirmed' && <button className="no-status-action" onClick={() => updateStatus(appt.id, 'in-progress')}>Start</button>}
                    {appt.status === 'in-progress' && <button className="no-status-action" onClick={() => updateStatus(appt.id, 'completed')}>Complete</button>}
                  </div>
                  <div className="no-appt-edit-delete">
                    <button className="no-appt-text-btn" onClick={() => openEdit(appt)}>Edit</button>
                    <button className="no-appt-text-btn danger" onClick={() => handleDelete(appt.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                No appointments found.
              </p>
            )}
          </div>
        )}
      </div>

      <Calendar currentUser={CURRENT_USER} dayTasks={MOCK_TASKS_TODAY} dayAgenda={MOCK_AGENDA_TODAY} />

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