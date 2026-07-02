// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/records/RecordsListPage.jsx
// CSS  : src/pages/staff/RecordsShared.css (shared)
//
// One generic, config-driven list page used by all 5 record
// types. Thin wrapper files (NurseNotes.jsx etc.) just pass
// a `type` prop in.
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NurseSidebar from '@/pages/staff/NurseSidebar'
import { AddRecordModal } from './AddRecordModal'
import {
  SearchIcon, ChevronDown, FolderIcon, GridIcon, ListIcon,
  ExpandIcon, CheckIcon, TrashIcon, PencilIcon,
} from './RecordIcons'
import {
  MOCK_APPOINTMENTS, MOCK_NOTES, MOCK_DOCUMENTS, MOCK_IMAGING, MOCK_LABS,
} from './mockData'
import './RecordsShared.css'

const TYPE_CONFIG = {
  appointments: { label: 'Appointments', addLabel: '+ Add Appointments', detailPath: '/staff/appointments' },
  notes:        { label: 'Notes',        addLabel: '+ Add Note',         detailPath: '/staff/notes' },
  documents:    { label: 'Documents',    addLabel: '+ Add Document',     detailPath: '/staff/documents' },
  imaging:      { label: 'Imaging',      addLabel: '+ Add Imaging',      detailPath: '/staff/imaging' },
  labs:         { label: 'Labs',         addLabel: '+ Add Lab',          detailPath: '/staff/labs' },
}

const DATA_MAP = {
  appointments: MOCK_APPOINTMENTS,
  notes:        MOCK_NOTES,
  documents:    MOCK_DOCUMENTS,
  imaging:      MOCK_IMAGING,
  labs:         MOCK_LABS,
}

export default function RecordsListPage({ type }) {
  const navigate = useNavigate()
  const config   = TYPE_CONFIG[type]
  const records  = DATA_MAP[type]

  const [search, setSearch]       = useState('')
  const [view, setView]           = useState('folder')
  const [showModal, setShowModal] = useState(false)
  const [page, setPage]           = useState(1)

  const openDetail = (id) => navigate(`${config.detailPath}/${id}`)

  return (
    <div className="rec-shell">
      <NurseSidebar />

      <div className="rec-main">

        {/* ── Top bar ────────────────────────────────── */}
        <div className="rec-topbar">
          <div className="rec-search">
            <SearchIcon />
            <input className="rec-search-input" placeholder="Search"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="rec-filter">
            <span className="rec-filter-label">Filter <ChevronDown /></span>
            <span className="rec-filter-sub">by patient</span>
          </div>

          <button className="rec-icon-btn" onClick={() => setShowModal(true)} aria-label="Add">
            <FolderIcon />
          </button>
          <button className={`rec-icon-btn${view === 'grid' ? ' active' : ''}`}
            onClick={() => setView('grid')} aria-label="Grid view">
            <GridIcon />
          </button>
          <button className={`rec-icon-btn${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')} aria-label="List view">
            <ListIcon />
          </button>
        </div>

        {/* ── List ───────────────────────────────────── */}
        {records.length > 0 ? (
          <div className="rec-list">
            {type === 'appointments'
              ? records.map(a => (
                  <div key={a.id} className="rec-appt-card" onClick={() => openDetail(a.id)}>
                    <img src={a.avatar} className="rec-appt-av" alt="" />
                    <div className="rec-appt-info">
                      <p className="rec-appt-name">{a.patientName}</p>
                      <p className="rec-appt-meta">{a.gender}, {a.age}</p>
                    </div>
                    <div className="rec-appt-reason">
                      <p className="rec-appt-reason-label">Reason to visit.</p>
                      <p className="rec-appt-reason-text">{a.reason}</p>
                      <div className="rec-appt-tags">
                        {a.tags.map(t => <span key={t} className="rec-appt-tag">{t}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="rec-appt-time">
                        <p className="rec-appt-date">{a.date}</p>
                        <p className="rec-appt-clock">{a.time}</p>
                      </div>
                      <div className="rec-appt-actions">
                        <button className="rec-appt-action-btn confirm" onClick={e => e.stopPropagation()}>
                          <CheckIcon /><span className="rec-appt-action-dot" />
                        </button>
                        <button className="rec-appt-action-btn delete" onClick={e => e.stopPropagation()}>
                          <TrashIcon /><span className="rec-appt-action-dot" />
                        </button>
                        <button className="rec-appt-action-btn edit" onClick={e => e.stopPropagation()}>
                          <PencilIcon /><span className="rec-appt-action-dot" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))

              : type === 'documents'
              ? records.map(d => (
                  <div key={d.id} className="rec-card" onClick={() => openDetail(d.id)}>
                    <img src={d.avatar} className="rec-card-av" alt="" />
                    <div className="rec-card-body">
                      <p className="rec-card-title">{d.title}</p>
                      <p className="rec-card-meta">From <b>{d.from}</b></p>
                      <div style={{
                        background: '#f9fafb', borderRadius: 14, padding: 16,
                        maxWidth: 280, fontSize: 9, color: '#9ca3af', lineHeight: 1.5,
                      }}>
                        Insurance document preview — open to view full file.
                      </div>
                    </div>
                  </div>
                ))

              : records.map(r => (
                  <div key={r.id} className="rec-card" onClick={() => openDetail(r.id)}>
                    <img src={r.avatar} className="rec-card-av" alt="" />
                    <div className="rec-card-body">
                      <p className="rec-card-title">{r.title}</p>
                      <p className="rec-card-meta">Last edited <b>{r.lastEditedBy}</b></p>
                      <span className="rec-card-context">{r.context}</span>
                      <p className="rec-card-preview">{r.preview}</p>
                    </div>

                    {r.liveReading ? (
                      <div style={{
                        background: '#1e293b', borderRadius: 18, padding: '10px 16px',
                        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                        alignSelf: 'flex-start', marginTop: 4,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                        }}>🩺</div>
                        <div>
                          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>
                            {r.liveReading.value}
                          </p>
                          <p style={{ color: '#9ca3af', fontSize: 9, margin: 0 }}>{r.liveReading.unit}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rec-card-thumbs">
                          {r.thumbs?.map(t => <div key={t} className="rec-card-thumb" />)}
                        </div>
                        <button className="rec-card-expand" onClick={e => e.stopPropagation()}>
                          <ExpandIcon />
                        </button>
                      </>
                    )}
                  </div>
                ))
            }
          </div>
        ) : (
          <div className="rec-empty">
            <p className="rec-empty-logo">+ Medic</p>
            <p className="rec-empty-sub">Care without the wait</p>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────── */}
        <div className="rec-pagination">
          {[1, 2].map(p => (
            <button key={p} className={`rec-page-dot${page === p ? ' active' : ''}`}
              onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      </div>

      {showModal && (
        <AddRecordModal type={type} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
