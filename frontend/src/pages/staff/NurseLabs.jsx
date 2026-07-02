// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseLabs.jsx
// CSS  : src/pages/staff/NurseLabs.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import NurseSidebar from './NurseSidebar'
import Calendar from '../../components/Calendar'
import RecordFormModal from '../../components/RecordFormModal'
import LabDetailView from '../../components/LabDetailView'
import './NurseLabs.css'

import doctor from '../../assets/images/doctor1.jpeg'

const ICONS = {
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>,
  flaskAdd: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-9.5-9C.8 8.4 2 5 5.5 5c2 0 3.5 1.2 4.5 2.8C11 6.2 12.5 5 14.5 5 18 5 19.2 8.4 21.5 12c-2.5 4.5-9.5 9-9.5 9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
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

// NOTE: the screenshot showed two fields both labeled "Description" —
// treated as a mock-up slip; second one repurposed as "Result" below.
const LAB_FIELDS = [
  { key: 'labTitle', label: 'Title', type: 'text', placeholder: 'Enter title' },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'Enter description', half: true },
  { key: 'result', label: 'Result', type: 'text', placeholder: 'Enter result', half: true },
  { key: 'patientName', label: 'Link patient to document', type: 'patient-select', placeholder: 'Enter patient' },
]

const INITIAL_LABS = [
  [{
    id: 1, title: 'Blood Pressure', sub: 'Last edited Dr. Kunett', av: doctor,
    tag: 'Results for Blood Pressure',
    text: 'The results denoted a systolic pressure of 138/90, and a diastolic pressure of 150/20. The patient is in critical condition.',
    stat: { value: 523, unit: 'mmHg', trend: '14' },
    labTitle: 'Blood Pressure',
    description: 'The results denoted a systolic pressure of 138/90, and a diastolic pressure of 150/20. The patient is in critical condition.',
    result: '523 mmHg',
    patientName: 'M. Vincent',
  }],
  [{
    id: 2, title: 'Glucose Panel', sub: 'Last edited Dr. Kunett', av: doctor,
    tag: 'Results for Glucose Panel',
    text: 'Fasting glucose levels are within normal range. No further action required at this time.',
    stat: { value: 96, unit: 'mg/dL', trend: '2' },
    labTitle: 'Glucose Panel',
    description: 'Fasting glucose levels are within normal range. No further action required at this time.',
    result: '96 mg/dL',
    patientName: 'H. Evans',
  }],
]

export default function NurseLabs() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [labPages, setLabPages] = useState(INITIAL_LABS)
  const [modal, setModal] = useState(null)
  const [viewingLab, setViewingLab] = useState(null)

  const labs = labPages[page] || []

  const openAdd = () => setModal({ mode: 'add' })
  const openEdit = (record) => setModal({ mode: 'edit', record })

  const handleSubmit = (values) => {
    if (modal.mode === 'edit') {
      setLabPages(pages => pages.map(p => p.map(l => l.id === modal.record.id
        ? { ...l, ...values, title: values.labTitle, tag: `Results for ${values.labTitle}`, text: values.description }
        : l)))
    } else {
      const newLab = {
        id: Date.now(),
        title: values.labTitle || 'Untitled Lab',
        sub: 'Last edited Dr. Kunett',
        av: doctor,
        tag: `Results for ${values.labTitle || 'Untitled'}`,
        text: values.description,
        stat: { value: 0, unit: values.result || '—', trend: '0' },
        ...values,
      }
      setLabPages(pages => {
        const next = [...pages]
        next[page] = [...(next[page] || []), newLab]
        return next
      })
    }
  }

  const handleLabeSave = (updated) => {
    setLabPages(pages => pages.map(p => p.map(n => n.id === updated.id ? updated : n)))
    setViewingLab(updated)
  }

  const handleLabDelete = (rec) => {
    setLabPages(pages => pages.map(p => p.filter(n => n.id !== rec.id)))
    setViewingLab(null)
  }

  return (
    <div className="no-shell">
      <NurseSidebar onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="no-content-header">
          <input className="no-content-search" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />

          <button className="no-content-filter">
            <span className="no-content-filter-label">Filter {ICONS.chevronDown}</span>
            <span className="no-content-filter-sub">by patient</span>
          </button>

          <button className="no-content-icon-btn" aria-label="Add lab" onClick={openAdd}>{ICONS.flaskAdd}</button>
          <button className="no-content-icon-btn" aria-label="Grid view">{ICONS.grid}</button>
          <button className="no-content-icon-btn" aria-label="Menu">{ICONS.menu}</button>
        </div>

        {viewingLab ? (
          <>
            <button className="rd-back-btn" onClick={() => setViewingLab(null)}>← Back to Labs</button>
            <LabDetailView record={viewingLab} onSave={handleLabSave} onDelete={handleLabDelete} />
          </>
        ) : (
          <>
            <div className="no-lab-grid">
              {labs.map(l => (
                <div key={l.id} className="no-lab-card-wrap">
                  <div className="no-lab-card">
                    <div className="no-rec-card-head">
                      <img src={l.av} className="no-rec-av" alt="" />
                      <div>
                        <p className="no-rec-title">{l.title}</p>
                        <p className="no-rec-sub">{l.sub}</p>
                      </div>
                      <button className="no-rec-menu" aria-label="Edit lab" onClick={() => setViewingLab(n)}>{ICONS.dots}</button>
                    </div>

                    <span className="no-lab-tag">{l.tag}</span>
                    <p className="no-lab-text">{l.text}</p>
                  </div>

                  <div className="no-lab-stat">
                    <div className="no-lab-stat-head">
                      <span className="no-lab-stat-icon">{ICONS.heart}</span>
                      <div>
                        <p className="no-lab-stat-value">{l.stat.value}<span className="no-lab-stat-trend">{l.stat.trend}▲</span></p>
                        <p className="no-lab-stat-unit">{l.stat.unit}</p>
                      </div>
                    </div>
                    <svg className="no-lab-sparkline" viewBox="0 0 140 40" preserveAspectRatio="none">
                      <polyline points="0,30 20,10 40,25 60,5 80,28 100,15 120,32 140,18" fill="none" stroke="#fff" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="no-pagination">
              {labPages.map((_, i) => (
                <button key={i} className={`no-pagination-dot${page === i ? ' active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
            </div>
          </>
        )}


      </div>

      {/* ── Calendar with real data ─────────────────────── */}
      <Calendar
        currentUser={currentUser}
        dayTasks={calendarTasks}
        dayAgenda={calendarAgenda}
        onAddTask={addTask}
        onCompleteTask={completeTask}
        newTaskValue={newTask}
        onNewTaskChange={setNewTask}
      />
      {modal && (
        <RecordFormModal
          typeLabel="Lab"
          fields={LAB_FIELDS}
          mode={modal.mode}
          initial={modal.record}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}