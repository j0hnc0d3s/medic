// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseAppointments.jsx
// CSS  : src/pages/staff/NurseAppointments.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import PatientSidebar from './PatientSidebar'
import Calendar from '../../components/Calendar'
import AppointmentFormModal from '../../components/AppointmentFormModal'
import './PatientAppointments.css'

import doctor from '../../assets/images/doctor1.jpeg'

const ICONS = {
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  calendarAdd: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  flask: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  note: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
}

const CURRENT_USER = { firstName: 'Sarah', lastName: 'Johnson', role: 'Registered Nurse', image: doctor, online: true, notifications: true }
const MOCK_TASKS_TODAY = [
  { id: 1, label: 'Follow up with Martha' },
  { id: 2, label: 'Follow up with Barry' },
]
const MOCK_AGENDA_TODAY = [
  { id: 1, time: '9:00 AM', label: 'H. Evans — General Consultation' },
  { id: 2, time: '11:30 AM', label: 'M. Vincent — Follow-up' },
]

const INITIAL_APPOINTMENTS = [
  [{
    id: 1, name: 'Mr. Harry Evans', meta: 'Male, 24', av: doctor,
    reason: 'Having headaches and fevers.',
    tags: [{ label: 'Peanut', active: false }, { label: 'Apples', active: true }],
    date: 'June 9th.', time: '09:00 PM',
    counts: { image: 2, flask: 2, note: 2 },
    patientName: 'H. Evans', doctorName: 'Dr. Kunett', apptType: 'General', notes: '',
  }],
  [{
    id: 2, name: 'Ms. Tameka Vincent', meta: 'Female, 30', av: doctor,
    reason: 'Routine hypertension follow-up.',
    tags: [{ label: 'Penicillin', active: true }],
    date: 'June 11th.', time: '11:00 AM',
    counts: { image: 1, flask: 3, note: 1 },
    patientName: 'M. Vincent', doctorName: 'Dr. Kunett', apptType: 'Specialist', notes: '',
  }],
]

export default function NurseAppointments() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [apptPages, setApptPages] = useState(INITIAL_APPOINTMENTS)
  const [modal, setModal] = useState(null)

  const appointments = apptPages[page] || []

  const openAdd = () => setModal({ mode: 'add' })
  const openEdit = (record) => setModal({ mode: 'edit', record })

  const handleSubmit = (values) => {
    if (modal.mode === 'edit') {
      setApptPages(pages => pages.map(p => p.map(a => a.id === modal.record.id
        ? {
            ...a, ...values,
            name: values.patientName || a.name,
            date: values.date || a.date,
            time: values.time || a.time,
          }
        : a)))
    } else {
      const newAppt = {
        id: Date.now(),
        name: values.patientName || 'Unnamed Patient',
        meta: '—',
        av: doctor,
        reason: values.notes || '—',
        tags: [],
        date: values.date || '—',
        time: values.time || '—',
        counts: { image: 0, flask: 0, note: 0 },
        ...values,
      }
      setApptPages(pages => {
        const next = [...pages]
        next[page] = [...(next[page] || []), newAppt]
        return next
      })
    }
  }

  return (
    <div className="no-shell">
      <PatientSidebar onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="no-content-header">
          <input className="no-content-search" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />

          <button className="no-content-filter">
            <span className="no-content-filter-label">Filter {ICONS.chevronDown}</span>
            <span className="no-content-filter-sub">by patient</span>
          </button>

          <button className="no-content-icon-btn" aria-label="Add appointment" onClick={openAdd}>{ICONS.calendarAdd}</button>
          <button className="no-content-icon-btn" aria-label="Grid view">{ICONS.grid}</button>
          <button className="no-content-icon-btn" aria-label="Menu">{ICONS.menu}</button>
        </div>

        <div className="no-appt-list">
          {appointments.map(appt => (
            <div key={appt.id} className="no-appt-card" onClick={() => openEdit(appt)}>
              <img src={appt.av} className="no-appt-av" alt="" />

              <div className="no-appt-patient">
                <p className="no-appt-name">{appt.name}</p>
                <p className="no-appt-meta">{appt.meta}</p>
              </div>

              <div className="no-appt-reason">
                <p className="no-appt-reason-label">Reason to visit.</p>
                <p className="no-appt-reason-text">{appt.reason}</p>
                <div className="no-appt-tags">
                  {appt.tags.map((t, i) => (
                    <span key={i} className={`no-appt-tag${t.active ? ' active' : ''}`}>{t.label}</span>
                  ))}
                </div>
              </div>

              <div className="no-appt-time">
                <p className="no-appt-date">{appt.date}</p>
                <p className="no-appt-time-value">{appt.time}</p>
              </div>

              <div className="no-appt-actions" onClick={e => e.stopPropagation()}>
                <button className="no-appt-action">{ICONS.image}<span className="no-appt-badge">{appt.counts.image}</span></button>
                <button className="no-appt-action">{ICONS.flask}<span className="no-appt-badge">{appt.counts.flask}</span></button>
                <button className="no-appt-action">{ICONS.note}<span className="no-appt-badge">{appt.counts.note}</span></button>
              </div>
            </div>
          ))}
        </div>

        <div className="no-pagination">
          {apptPages.map((_, i) => (
            <button key={i} className={`no-pagination-dot${page === i ? ' active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
        </div>
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