// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseDocuments.jsx
// CSS  : src/pages/staff/NurseDocuments.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import PatientSidebar from './PatientSidebar'
import Calendar from '../../components/Calendar'
import RecordFormModal from '../../components/RecordFormModal'
import './PatientDocuments.css'

import doctor from '../../assets/images/doctor1.jpeg'
import scan1 from '../../assets/images/scan1.jpeg'
import scan2 from '../../assets/images/scan2.jpeg'

const ICONS = {
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  menu: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
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

const DOCUMENT_FIELDS = [
  { key: 'docName', label: 'Document Name', type: 'text', placeholder: 'Enter document name' },
  { key: 'patientName', label: 'Link patient to document', type: 'patient-select', placeholder: 'Enter patient name' },
]

const INITIAL_DOCUMENTS = [
  [{ id: 1, title: 'Insurance Coverage', sub: 'From Melissa Vincent', av: doctor, preview: scan1, docName: 'Insurance Coverage', patientName: 'M. Vincent' }],
  [{ id: 2, title: 'Referral Letter', sub: 'From Dr. Marcel Brown', av: doctor, preview: scan2, docName: 'Referral Letter', patientName: 'H. Evans' }],
]

export default function NurseDocuments() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [docPages, setDocPages] = useState(INITIAL_DOCUMENTS)
  const [modal, setModal] = useState(null)

  const docs = docPages[page] || []

  const openAdd = () => setModal({ mode: 'add' })
  const openEdit = (record) => setModal({ mode: 'edit', record })

  const handleSubmit = (values) => {
    if (modal.mode === 'edit') {
      setDocPages(pages => pages.map(p => p.map(d => d.id === modal.record.id
        ? { ...d, ...values, title: values.docName, sub: `From ${values.patientName || 'Unknown'}` }
        : d)))
    } else {
      const newDoc = {
        id: Date.now(),
        title: values.docName || 'Untitled Document',
        sub: `From ${values.patientName || 'Unknown'}`,
        av: doctor,
        preview: scan1,
        ...values,
      }
      setDocPages(pages => {
        const next = [...pages]
        next[page] = [...(next[page] || []), newDoc]
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

          <button className="no-content-icon-btn" aria-label="Add document" onClick={openAdd}>{ICONS.folder}</button>
          <button className="no-content-icon-btn" aria-label="Grid view">{ICONS.grid}</button>
          <button className="no-content-icon-btn" aria-label="Menu">{ICONS.menu}</button>
        </div>

        <div className="no-doc-grid">
          {docs.map(doc => (
            <div key={doc.id} className="no-doc-card">
              <div className="no-rec-card-head">
                <img src={doc.av} className="no-rec-av" alt="" />
                <div>
                  <p className="no-rec-title">{doc.title}</p>
                  <p className="no-rec-sub">{doc.sub}</p>
                </div>
                <button className="no-rec-menu" aria-label="Edit document" onClick={() => openEdit(doc)}>{ICONS.dots}</button>
              </div>

              <div className="no-doc-preview">
                <img src={doc.preview} className="no-doc-preview-img" alt="" />
              </div>
            </div>
          ))}
        </div>

        <div className="no-pagination">
          {docPages.map((_, i) => (
            <button key={i} className={`no-pagination-dot${page === i ? ' active' : ''}`} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
        </div>
      </div>

      <Calendar currentUser={CURRENT_USER} dayTasks={MOCK_TASKS_TODAY} dayAgenda={MOCK_AGENDA_TODAY} />

      {modal && (
        <RecordFormModal
          typeLabel="Document"
          fields={DOCUMENT_FIELDS}
          mode={modal.mode}
          initial={modal.record}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}