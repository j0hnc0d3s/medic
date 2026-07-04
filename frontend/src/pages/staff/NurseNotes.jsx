// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseNotes.jsx
// CSS  : src/pages/staff/NurseNotes.css
//
// Same skeleton as NurseLabs.jsx/NurseImaging.jsx — search + filter
// header, real-data list, add-modal flow — here noteService,
// operating on a new `notes` collection.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { noteService, patientService } from '../../services'
import NurseSidebar from './NurseSidebar'
import AddNoteModal from '../../components/AddNoteModal'
import './NurseNotes.css'

const ICONS = {
  note:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h13l3 3v13a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  grid:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  list:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>,
}

const SORT_OPTIONS = [
  { key: 'patient', label: 'by patient' },
  { key: 'recent',  label: 'by recent'  },
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

export default function NurseNotes() {
  const { userProfile } = useAuth()

  const [notes, setNotes]       = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('recent')
  const [showSort, setShowSort] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [page, setPage]         = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => { loadNotes(); loadPatients() }, [])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const res = await noteService.getNotes()
      if (res.success) setNotes(res.notes || [])
    } catch (err) {
      console.error('Failed to load notes:', err)
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
    let list = notes.filter(n =>
      `${n.title} ${n.patientName} ${n.description}`.toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === 'patient') {
      list = [...list].sort((a, b) => (a.patientName || '').localeCompare(b.patientName || ''))
    } else {
      list = [...list].sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return db_ - da
      })
    }
    return list
  }, [notes, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, sortBy])

  const openAdd  = () => { setEditingNote(null); setShowAddModal(true) }
  const openEdit = (n) => { setEditingNote(n); setShowAddModal(true); setOpenMenuId(null) }

  const handleDelete = async (n) => {
    setOpenMenuId(null)
    if (!window.confirm(`Delete this note?`)) return
    try {
      await noteService.deleteNote(n.id)
      loadNotes()
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
      const data = { ...payload, createdBy: staffName, updatedBy: staffName }

      const res = editingNote
        ? await noteService.updateNote(editingNote.id, data)
        : await noteService.createNote(data)

      if (!res.success) throw new Error(res.error)

      setShowAddModal(false)
      setEditingNote(null)
      loadNotes()
    } catch (err) {
      console.error('Failed to save note:', err)
      alert('Failed to save note')
    } finally {
      setSaving(false)
    }
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

          <button className="no-content-icon-btn" aria-label="Add note" onClick={openAdd}>
            {ICONS.note}
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
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading notes…</p>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="no-note-list">
                {paginated.map(n => {
                  const patient = n.patientId ? patientById.get(n.patientId) : null
                  return (
                    <div key={n.id} className="no-note-card">
                      <div className="no-note-card-head">
                        {patient?.profilePictureUrl ? (
                          <img src={patient.profilePictureUrl} className="no-note-av" alt="" />
                        ) : (
                          <div className="no-note-av no-note-av--initials" style={{ background: avColorFor(n.patientId || n.id) }}>
                            {n.patientName ? getInitials(...n.patientName.split(' ')) : '—'}
                          </div>
                        )}
                        <div className="no-note-card-title-wrap">
                          <p className="no-note-title">{n.title || 'Note'}</p>
                          <p className="no-note-sub">
                            {n.updatedBy ? `Last edited by ${n.updatedBy}` : (n.createdBy ? `Added by ${n.createdBy}` : '—')}
                          </p>
                        </div>
                        <div className="no-note-menu-wrap">
                          <button className="no-note-menu-btn" onClick={() => setOpenMenuId(openMenuId === n.id ? null : n.id)} aria-label="Options">
                            {ICONS.dots}
                          </button>
                          {openMenuId === n.id && (
                            <div className="no-note-menu">
                              <button onClick={() => openEdit(n)}>Edit</button>
                              <button onClick={() => handleDelete(n)} className="danger">Delete</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {(n.description || (n.images && n.images.length > 0)) && (
                        <div className="no-note-body">
                          {n.description && (
                            <>
                              <p className="no-note-body-label">
                                Notes {n.patientName ? `for ${n.patientName}` : ''}
                              </p>
                              <p className="no-note-body-text">{n.description}</p>
                            </>
                          )}
                          {n.images && n.images.length > 0 && (
                            <div className="no-note-thumbs">
                              {n.images.slice(0, 4).map((img, i) => (
                                <img key={i} src={img.url} alt={img.name || `attachment ${i + 1}`} className="no-note-thumb" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="no-note-footer">
                        <span className="no-note-patient">{n.patientName || 'Unlinked'}</span>
                        <span className="no-note-date">{formatDate(n.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No notes found.
                  </p>
                )}
              </div>
            ) : (
              <div className="no-note-grid">
                {paginated.map(n => (
                  <div key={n.id} className="no-note-grid-card" onClick={() => openEdit(n)}>
                    <p className="no-note-title">{n.title || 'Note'}</p>
                    <p className="no-note-sub">{n.patientName || 'Unlinked'}</p>
                    <p className="no-note-grid-desc">{n.description || 'No description'}</p>
                    <p className="no-note-date">{formatDate(n.createdAt)}</p>
                  </div>
                ))}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No notes found.
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
        <AddNoteModal
          patients={patients}
          editingNote={editingNote}
          saving={saving}
          onSubmit={handleSave}
          onClose={() => { setShowAddModal(false); setEditingNote(null) }}
        />
      )}
    </div>
  )
}
