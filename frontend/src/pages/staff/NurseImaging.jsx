// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseImaging.jsx
// CSS  : src/pages/staff/NurseImaging.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import NurseSidebar from './NurseSidebar'
import Calendar from '../../components/Calendar'
import RecordFormModal from '../../components/RecordFormModal'
import ImagingDetailView from '../../components/ImagingDetailView'
import './NurseImaging.css'

import doctor from '../../assets/images/doctor1.jpeg'
import scan1 from '../../assets/images/scan1.jpeg'
import scan2 from '../../assets/images/scan2.jpeg'

const ICONS = {
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>,
  imageAdd: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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

const IMAGING_FIELDS = [
  { key: 'imgTitle', label: 'Title', type: 'text', placeholder: 'Enter title' },
  { key: 'description', label: 'Description', type: 'text', placeholder: 'Enter description' },
  { key: 'patientName', label: 'Link patient to document', type: 'patient-select', placeholder: 'Enter patient' },
]

const INITIAL_IMAGING = [
  [{
    id: 1, title: 'Cardiogram', sub: 'Last edited Dr. Kunett', av: doctor,
    tag: 'Results for Cardiogram',
    text: "Shows an enlarge heart from her condition that constricts it, to less than it's normal size. Immediate surgery is recommended.",
    scans: [scan1, scan2],
    imgTitle: 'Cardiogram',
    description: "Shows an enlarge heart from her condition that constricts it, to less than it's normal size. Immediate surgery is recommended.",
    patientName: 'M. Vincent',
  }],
  [{
    id: 2, title: 'Chest X-Ray', sub: 'Last edited Dr. Kunett', av: doctor,
    tag: 'Results for Chest X-Ray',
    text: 'Lungs appear clear with no signs of fluid buildup or fractures. Follow-up scan recommended in 6 months.',
    scans: [scan1, scan2],
    imgTitle: 'Chest X-Ray',
    description: 'Lungs appear clear with no signs of fluid buildup or fractures. Follow-up scan recommended in 6 months.',
    patientName: 'H. Evans',
  }],
]

export default function NurseImaging() {
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [imgPages, setImgPages] = useState(INITIAL_IMAGING)
  const [modal, setModal] = useState(null)
  const [viewingImage, setViewingImage] = useState(null)

  const records = imgPages[page] || []

  const openAdd = () => setModal({ mode: 'add' })
  const openEdit = (record) => setModal({ mode: 'edit', record })

  const handleSubmit = (values) => {
    if (modal.mode === 'edit') {
      setImgPages(pages => pages.map(p => p.map(r => r.id === modal.record.id
        ? { ...r, ...values, title: values.imgTitle, tag: `Results for ${values.imgTitle}`, text: values.description }
        : r)))
    } else {
      const newRecord = {
        id: Date.now(),
        title: values.imgTitle || 'Untitled Scan',
        sub: 'Last edited Dr. Kunett',
        av: doctor,
        tag: `Results for ${values.imgTitle || 'Untitled'}`,
        text: values.description,
        scans: [scan1, scan2],
        ...values,
      }
      setImgPages(pages => {
        const next = [...pages]
        next[page] = [...(next[page] || []), newRecord]
        return next
      })
    }
  }

  const handleImagingSave = (updated) => {
    setImgPages(pages => pages.map(p => p.map(n => n.id === updated.id ? updated : n)))
    setViewingImage(updated)
  }
  
  const handleImagingDelete = (rec) => {
    setImgPages(pages => pages.map(p => p.filter(n => n.id !== rec.id)))
    setViewingImage(null)
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

          <button className="no-content-icon-btn" aria-label="Add imaging" onClick={openAdd}>{ICONS.imageAdd}</button>
          <button className="no-content-icon-btn" aria-label="Grid view">{ICONS.grid}</button>
          <button className="no-content-icon-btn" aria-label="Menu">{ICONS.menu}</button>
        </div>

        {viewingImage ? (
          <>
            <button className="rd-back-btn" onClick={() => setViewingImage(null)}>← Back to Imaging</button>
            <NoteDetailView record={viewingImage} onSave={handleImagingSave} onDelete={handleImagingDelete} />
          </>
        ) : (
          <>
            <div className="no-img-grid">
              {records.map(r => (
                <div key={r.id} className="no-img-card">
                  <div className="no-rec-card-head">
                    <img src={r.av} className="no-rec-av" alt="" />
                    <div>
                      <p className="no-rec-title">{r.title}</p>
                      <p className="no-rec-sub">{r.sub}</p>
                    </div>
                    <button className="no-rec-menu" aria-label="Edit imaging" onClick={() => setViewingImage(n)}>{ICONS.dots}</button>
                  </div>

                  <div className="no-img-body">
                    <div className="no-img-text-col">
                      <span className="no-img-tag">{r.tag}</span>
                      <p className="no-img-text">{r.text}</p>
                    </div>

                    <div className="no-img-scans">
                      {r.scans.map((src, i) => <img key={i} src={src} className="no-img-scan" alt="" />)}
                    </div>
                  </div>

                  <button className="no-img-expand" aria-label="View all scans">{ICONS.image}</button>
                </div>
              ))}
            </div>

            <div className="no-pagination">
              {imgPages.map((_, i) => (
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
          typeLabel="Imaging"
          fields={IMAGING_FIELDS}
          mode={modal.mode}
          initial={modal.record}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}