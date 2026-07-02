// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseNotes.jsx
// CSS  : src/pages/staff/NurseNotes.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import NurseSidebar from './NurseSidebar'
import Calendar from '../../components/Calendar'
import RecordFormModal from '../../components/RecordFormModal'
import NoteDetailView from '../../components/NoteDetailView'
import './NurseNotes.css'

import doctor from '../../assets/images/doctor1.jpeg'
import scan1 from '../../assets/images/scan1.jpeg'
import scan2 from '../../assets/images/scan2.jpeg'

const ICONS = {
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>,
  noteAdd: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h13l3 3v13a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 13h5M8 9h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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

const NOTE_FIELDS = [
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter note' },
  { key: 'patientName', label: 'Link patient to document', type: 'patient-select', placeholder: 'Enter patient name' },
]

const INITIAL_NOTES = [
  [{
    id: 1, title: 'On Hypertension', sub: 'Last edited Dr. Kunett', av: doctor,
    tag: 'Notes for Tameka Vincent',
    text: 'Miss Tameka Vincent shows symptoms of acute hypertension, after a thorough analysis I recommended medicine that should ease any escalate realities caused by high blood pressure.',
    thumbs: [scan1, scan2],
    description: 'Miss Tameka Vincent shows symptoms of acute hypertension, after a thorough analysis I recommended medicine that should ease any escalate realities caused by high blood pressure.',
    patientName: 'M. Vincent',
  }],
  [{
    id: 2, title: 'Post-Op Checkup', sub: 'Last edited Dr. Kunett', av: doctor,
    tag: 'Notes for Harry Evans',
    text: 'Patient recovering well following appendectomy. No signs of infection at incision site. Cleared for light activity.',
    thumbs: [scan1, scan2],
    description: 'Patient recovering well following appendectomy. No signs of infection at incision site. Cleared for light activity.',
    patientName: 'H. Evans',
  }],
]

export default function NurseNotes() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [notesPages, setNotesPages] = useState(INITIAL_NOTES)
  const [modal, setModal] = useState(null) // { mode: 'add' | 'edit', record? }
  const [viewingNote, setViewingNote] = useState(null)

  const notes = notesPages[page] || []

  const openAdd = () => setModal({ mode: 'add' })
  const openEdit = (record) => setModal({ mode: 'edit', record })

  const handleSubmit = (values) => {
    if (modal.mode === 'edit') {
      setNotesPages(pages => pages.map(p => p.map(n => n.id === modal.record.id
        ? { ...n, ...values, tag: `Notes for ${values.patientName || n.tag.replace('Notes for ', '')}`, text: values.description }
        : n)))
    } else {
      const newNote = {
        id: Date.now(),
        title: values.description?.slice(0, 24) || 'Untitled Note',
        sub: 'Last edited Dr. Kunett',
        av: doctor,
        tag: `Notes for ${values.patientName || 'Unknown'}`,
        text: values.description,
        thumbs: [scan1, scan2],
        ...values,
      }
      setNotesPages(pages => {
        const next = [...pages]
        next[page] = [...(next[page] || []), newNote]
        return next
      })
    }
  }

  const handleNoteSave = (updated) => {
    setNotesPages(pages => pages.map(p => p.map(n => n.id === updated.id ? updated : n)))
    setViewingNote(updated)
  }
  
  const handleNoteDelete = (rec) => {
    setNotesPages(pages => pages.map(p => p.filter(n => n.id !== rec.id)))
    setViewingNote(null)
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

          <button className="no-content-icon-btn" aria-label="Add note" onClick={openAdd}>{ICONS.noteAdd}</button>
          <button className="no-content-icon-btn" aria-label="Grid view">{ICONS.grid}</button>
          <button className="no-content-icon-btn" aria-label="Menu">{ICONS.menu}</button>
        </div>

        {viewingNote ? (
          <>
            <button className="rd-back-btn" onClick={() => setViewingNote(null)}>← Back to Notes</button>
            <NoteDetailView record={viewingNote} onSave={handleNoteSave} onDelete={handleNoteDelete} />
          </>
        ) : (
          <>
            <div className="no-note-grid">
              {notes.map(n => (
                <div key={n.id} className="no-note-card">
                  <div className="no-rec-card-head">
                    <img src={n.av} className="no-rec-av" alt="" />
                    <div>
                      <p className="no-rec-title">{n.title}</p>
                      <p className="no-rec-sub">{n.sub}</p>
                    </div>

                    <button className="no-rec-menu" aria-label="View note" onClick={() => setViewingNote(n)}>{ICONS.dots}</button>
                  </div>

                  <div className="no-note-body">
                    <div className="no-note-text-col">
                      <span className="no-note-tag">{n.tag}</span>
                      <p className="no-note-text">{n.text}</p>
                    </div>

                    <div className="no-note-thumbs">
                      {n.thumbs.map((src, i) => <img key={i} src={src} className="no-note-thumb" alt="" />)}
                    </div>
                  </div>

                  <button className="no-note-expand" aria-label="View all attachments">{ICONS.image}</button>
                </div>
              ))}
            </div>

            <div className="no-pagination">
              {notesPages.map((_, i) => (
                <button key={i} className={`no-pagination-dot${page === i ? ' active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
            </div>
          </>
        )}
      </div>

      <Calendar currentUser={CURRENT_USER} dayTasks={MOCK_TASKS_TODAY} dayAgenda={MOCK_AGENDA_TODAY} />

      {modal && (
        <RecordFormModal
          typeLabel="Note"
          fields={NOTE_FIELDS}
          mode={modal.mode}
          initial={modal.record}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}