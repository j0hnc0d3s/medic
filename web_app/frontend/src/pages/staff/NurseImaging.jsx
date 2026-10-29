// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseImaging.jsx
// CSS  : src/pages/staff/NurseImaging.css
//
// Same skeleton as NurseLabs.jsx: search + filter header,
// real-data list fed by a service call, and a modal for the
// create/write flow — here imagingService instead of labService,
// operating on a new `imaging` collection.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { imagingService, patientService } from '../../services'
import NurseSidebar from './NurseSidebar'
import AddImagingModal from '../../components/AddImagingModal'
import './NurseImaging.css'

const ICONS = {
  brain: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3a3 3 0 00-3 3v1a3 3 0 00-2 5 3 3 0 002 5v1a3 3 0 006 0V6a3 3 0 00-3-3zM15 3a3 3 0 013 3v1a3 3 0 012 5 3 3 0 01-2 5v1a3 3 0 01-6 0V6a3 3 0 013-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  grid:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  list:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>,
  image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const SORT_OPTIONS = [
  { key: 'patient', label: 'by patient' },
  { key: 'recent',  label: 'by recent'  },
  { key: 'title',   label: 'by title'   },
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

export default function NurseImaging() {
  const { userProfile } = useAuth()

  const [records, setRecords]   = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('recent')
  const [showSort, setShowSort] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [page, setPage]         = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingImaging, setEditingImaging] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => { loadRecords(); loadPatients() }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const res = await imagingService.getImagingRecords()
      if (res.success) setRecords(res.records || [])
    } catch (err) {
      console.error('Failed to load imaging records:', err)
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
    let list = records.filter(r =>
      `${r.title} ${r.patientName}`.toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === 'patient') {
      list = [...list].sort((a, b) => (a.patientName || '').localeCompare(b.patientName || ''))
    } else if (sortBy === 'title') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else {
      list = [...list].sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return db_ - da
      })
    }
    return list
  }, [records, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, sortBy])

  const openAdd  = () => { setEditingImaging(null); setShowAddModal(true) }
  const openEdit = (r) => { setEditingImaging(r); setShowAddModal(true); setOpenMenuId(null) }

  const handleDelete = async (r) => {
    setOpenMenuId(null)
    if (!window.confirm(`Delete "${r.title}"?`)) return
    try {
      await imagingService.deleteImaging(r.id)
      loadRecords()
    } catch (err) {
      console.error('Failed to delete imaging:', err)
    }
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
      const data = { ...payload, createdBy: staffName, updatedBy: staffName }

      const res = editingImaging
        ? await imagingService.updateImaging(editingImaging.id, data)
        : await imagingService.createImaging(data)

      if (!res.success) throw new Error(res.error)

      setShowAddModal(false)
      setEditingImaging(null)
      loadRecords()
    } catch (err) {
      console.error('Failed to save imaging:', err)
      alert('Failed to save imaging record')
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

          <button className="no-content-icon-btn" aria-label="Add imaging" onClick={openAdd}>
            {ICONS.brain}
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
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading imaging…</p>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="no-img-list">
                {paginated.map(r => {
                  const patient = r.patientId ? patientById.get(r.patientId) : null
                  return (
                    <div key={r.id} className="no-img-card">
                      <div className="no-img-card-head">
                        {patient?.profilePictureUrl ? (
                          <img src={patient.profilePictureUrl} className="no-img-av" alt="" />
                        ) : (
                          <div className="no-img-av no-img-av--initials" style={{ background: avColorFor(r.patientId || r.id) }}>
                            {r.patientName ? getInitials(...r.patientName.split(' ')) : '—'}
                          </div>
                        )}
                        <div className="no-img-card-title-wrap">
                          <p className="no-img-title">{r.title || 'Untitled'}</p>
                          <p className="no-img-sub">
                            {r.updatedBy ? `Last edited by ${r.updatedBy}` : (r.createdBy ? `Added by ${r.createdBy}` : '—')}
                          </p>
                        </div>
                        <div className="no-img-menu-wrap">
                          <button className="no-img-menu-btn" onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)} aria-label="Options">
                            {ICONS.dots}
                          </button>
                          {openMenuId === r.id && (
                            <div className="no-img-menu">
                              <button onClick={() => openEdit(r)}>Edit</button>
                              <button onClick={() => handleDelete(r)} className="danger">Delete</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {(r.description || (r.images && r.images.length > 0)) && (
                        <div className="no-img-body">
                          {r.description && (
                            <>
                              <p className="no-img-body-label">Results for {r.title}</p>
                              <p className="no-img-body-text">{r.description}</p>
                            </>
                          )}
                          {r.images && r.images.length > 0 && (
                            <div className="no-img-thumbs">
                              {r.images.slice(0, 4).map((img, i) => (
                                <img key={i} src={img.url} alt={img.name || `scan ${i + 1}`} className="no-img-thumb" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="no-img-footer">
                        <span className="no-img-patient">
                          {r.patientName || 'Unlinked'}
                          {r.linkedConsultationName && ` · ${r.linkedConsultationName}`}
                        </span>
                        <span className="no-img-date">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No imaging records found.
                  </p>
                )}
              </div>
            ) : (
              <div className="no-img-grid">
                {paginated.map(r => (
                  <div key={r.id} className="no-img-grid-card" onClick={() => openEdit(r)}>
                    {r.images?.[0] && <img src={r.images[0].url} className="no-img-grid-thumb" alt="" />}
                    <p className="no-img-title">{r.title || 'Untitled'}</p>
                    <p className="no-img-sub">{r.patientName || 'Unlinked'}</p>
                    <p className="no-img-date">{formatDate(r.createdAt)}</p>
                  </div>
                ))}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No imaging records found.
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
        <AddImagingModal
          patients={patients}
          editingImaging={editingImaging}
          saving={saving}
          onSubmit={handleSave}
          onClose={() => { setShowAddModal(false); setEditingImaging(null) }}
        />
      )}
    </div>
  )
}
