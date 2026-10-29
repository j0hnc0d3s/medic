// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseDocuments.jsx
// CSS  : src/pages/staff/NurseDocuments.css
//
// Same skeleton as NurseLabs.jsx/NurseImaging.jsx/NurseNotes.jsx —
// search + filter header, real-data list, add-modal flow — here
// documentService (already existed) instead of a new one. No
// consultation gate — a document is general paperwork, not a test.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { documentService, patientService } from '../../services'
import NurseSidebar from './NurseSidebar'
import AddDocumentModal from '../../components/AddDocumentModal'
import './NurseDocuments.css'

const ICONS = {
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  grid:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  list:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>,
  file: <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.4"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.4"/></svg>,
}

const SORT_OPTIONS = [
  { key: 'patient', label: 'by patient' },
  { key: 'recent',  label: 'by recent'  },
  { key: 'name',    label: 'by name'    },
]

const AV_COLORS = ['#2D9C9C', '#1F4788', '#8B5CF6', '#F59E0B', '#6B7280']
const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()
const avColorFor = (id) => AV_COLORS[[...String(id || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]

const formatDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const PAGE_SIZE = 6

export default function NurseDocuments() {
  const { userProfile } = useAuth()

  const [documents, setDocuments] = useState([])
  const [patients, setPatients]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [sortBy, setSortBy]       = useState('recent')
  const [showSort, setShowSort]   = useState(false)
  const [viewMode, setViewMode]   = useState('list')
  const [page, setPage]           = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => { loadDocuments(); loadPatients() }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await documentService.getDocuments()
      if (res.success) setDocuments(res.documents || [])
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPatients = async () => {
    try {
      const res = await patientService.getPatients()
      if (res.success) setPatients(res.patients || [])
    } catch (err) {
      console.error('Failed to load patients:', err)
    }
  }

  const patientById = useMemo(() => {
    const map = new Map()
    patients.forEach(p => map.set(p.id, p))
    return map
  }, [patients])

  const filtered = useMemo(() => {
    let list = documents.filter(d =>
      `${d.name} ${d.patientName}`.toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === 'patient') {
      list = [...list].sort((a, b) => (a.patientName || '').localeCompare(b.patientName || ''))
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else {
      list = [...list].sort((a, b) => {
        const da = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt || 0)
        const db_ = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt || 0)
        return db_ - da
      })
    }
    return list
  }, [documents, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, sortBy])

  const openAdd  = () => { setEditingDocument(null); setShowAddModal(true) }
  const openEdit = (d) => { setEditingDocument(d); setShowAddModal(true); setOpenMenuId(null) }

  const handleDelete = async (d) => {
    setOpenMenuId(null)
    if (!window.confirm(`Delete "${d.name}"?`)) return
    try {
      await documentService.deleteDocument(d.id)
      loadDocuments()
    } catch (err) {
      console.error('Failed to delete document:', err)
    }
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'

      if (editingDocument) {
        const res = await documentService.updateDocument(editingDocument.id, { ...payload, updatedBy: staffName })
        if (!res.success) throw new Error(res.error)
      }
      // New documents are created inside AddDocumentModal itself via
      // documentService.uploadDocument (it needs the File object,
      // which doesn't round-trip through this handler) — nothing
      // further to do here for the create path but refresh the list.

      setShowAddModal(false)
      setEditingDocument(null)
      loadDocuments()
    } catch (err) {
      console.error('Failed to save document:', err)
      alert('Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  const renderPreview = (d) => {
    const type = d.type || (d.fileName ? documentService.getFileType(d.fileName) : 'other')
    if (type === 'image' && d.url) {
      return <img src={d.url} alt={d.name} className="no-doc-preview-img" />
    }
    if (type === 'pdf' && d.url) {
      return <iframe src={d.url} title={d.name} className="no-doc-preview-frame" />
    }
    return (
      <div className="no-doc-preview-fallback">
        {ICONS.file}
        <span>{d.fileName || 'No file attached'}</span>
      </div>
    )
  }

  return (
    <div className="no-shell">
      <NurseSidebar />

      <div className="no-main">
        <div className="no-content-header">
          <input className="no-content-search" placeholder="Search"
            value={search} onChange={e => setSearch(e.target.value)} />

          <div className="no-content-filter-wrap">
            <button className="no-content-filter" onClick={() => setShowSort(s => !s)}>
              <span className="no-content-filter-label">Filter {ICONS.chevronDown}</span>
              <span className="no-content-filter-sub">{SORT_OPTIONS.find(o => o.key === sortBy)?.label}</span>
            </button>

            {showSort && (
              <div className="no-filter-menu">
                {SORT_OPTIONS.map(o => (
                  <button key={o.key}
                    className={`no-filter-menu-item${sortBy === o.key ? ' active' : ''}`}
                    onClick={() => { setSortBy(o.key); setShowSort(false) }}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="no-content-icon-btn" aria-label="Add document" onClick={openAdd}>
            {ICONS.folder}
          </button>

          <button className={`no-content-icon-btn${viewMode === 'grid' ? ' active' : ''}`}
            aria-label="Grid view" onClick={() => setViewMode('grid')}>
            {ICONS.grid}
          </button>

          <button className={`no-content-icon-btn${viewMode === 'list' ? ' active' : ''}`}
            aria-label="List view" onClick={() => setViewMode('list')}>
            {ICONS.list}
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading documents…</p>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="no-doc-list">
                {paginated.map(d => {
                  const patient = d.patientId ? patientById.get(d.patientId) : null
                  return (
                    <div key={d.id} className="no-doc-card">
                      <div className="no-doc-card-head">
                        {patient?.profilePictureUrl ? (
                          <img src={patient.profilePictureUrl} className="no-doc-av" alt="" />
                        ) : (
                          <div className="no-doc-av no-doc-av--initials" style={{ background: avColorFor(d.patientId || d.id) }}>
                            {d.patientName ? getInitials(...d.patientName.split(' ')) : '—'}
                          </div>
                        )}
                        <div className="no-doc-card-title-wrap">
                          <p className="no-doc-title">{d.name || 'Untitled Document'}</p>
                          <p className="no-doc-sub">{d.patientName ? `From ${d.patientName}` : '—'}</p>
                        </div>
                        <div className="no-doc-menu-wrap">
                          <button className="no-doc-menu-btn" onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)} aria-label="Options">
                            {ICONS.dots}
                          </button>
                          {openMenuId === d.id && (
                            <div className="no-doc-menu">
                              <button onClick={() => openEdit(d)}>Edit</button>
                              <a href={d.url} target="_blank" rel="noreferrer" className="no-doc-menu-link">Open</a>
                              <button onClick={() => handleDelete(d)} className="danger">Delete</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="no-doc-preview">
                        {renderPreview(d)}
                      </div>

                      <div className="no-doc-footer">
                        <span className="no-doc-size">{d.size || '—'}</span>
                        <span className="no-doc-date">{formatDate(d.uploadedAt)}</span>
                      </div>
                    </div>
                  )
                })}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No documents found.
                  </p>
                )}
              </div>
            ) : (
              <div className="no-doc-grid">
                {paginated.map(d => (
                  <div key={d.id} className="no-doc-grid-card" onClick={() => openEdit(d)}>
                    <p className="no-doc-title">{d.name || 'Untitled Document'}</p>
                    <p className="no-doc-sub">{d.patientName ? `From ${d.patientName}` : 'Unlinked'}</p>
                    <p className="no-doc-date">{formatDate(d.uploadedAt)}</p>
                  </div>
                ))}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No documents found.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {totalPages > 1 && (
          <div className="no-pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`no-pagination-dot${page === i ? ' active' : ''}`}
                onClick={() => setPage(i)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDocumentModal
          patients={patients}
          editingDocument={editingDocument}
          saving={saving}
          onSubmit={handleSave}
          onClose={() => { setShowAddModal(false); setEditingDocument(null) }}
        />
      )}
    </div>
  )
}
