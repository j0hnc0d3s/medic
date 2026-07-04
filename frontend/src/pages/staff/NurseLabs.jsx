// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseLabs.jsx
// CSS  : src/pages/staff/NurseLabs.css
//
// Same skeleton as NursePatients.jsx: search + filter header,
// real-data list fed by a service call, and a modal for the
// create/write flow — here labService instead of patientService,
// operating on a new `labs` collection.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { labService, patientService } from '../../services'
import NurseSidebar from './NurseSidebar'
import AddLabModal from '../../components/AddLabModal'
import './NurseLabs.css'

const ICONS = {
  flask: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  grid:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  list:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>,
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

// Short "Key: value" preview from a lab's structured results object —
// falls back to free-text notes for Custom-type labs, which have no
// fixed field set.
const summarizeResults = (lab) => {
  const entries = Object.entries(lab.results || {}).filter(([, v]) => v !== '' && v != null)
  if (entries.length > 0) {
    return entries.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')
  }
  return lab.notes || ''
}

const PAGE_SIZE = 6

export default function NurseLabs() {
  const { userProfile } = useAuth()

  const [labs, setLabs]         = useState([])
  const [patients, setPatients] = useState([]) // for the modal's patient picker + avatar lookup
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('recent')
  const [showSort, setShowSort] = useState(false)
  const [viewMode, setViewMode] = useState('list') // list | grid
  const [page, setPage]         = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLab, setEditingLab] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)

  useEffect(() => { loadLabs(); loadPatients() }, [])

  const loadLabs = async () => {
    setLoading(true)
    try {
      const res = await labService.getLabs()
      if (res.success) setLabs(res.labs || [])
    } catch (err) {
      console.error('Failed to load labs:', err)
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
    let list = labs.filter(l =>
      `${l.title} ${l.patientName}`.toLowerCase().includes(search.toLowerCase())
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
  }, [labs, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, sortBy])

  const openAdd  = () => { setEditingLab(null); setShowAddModal(true) }
  const openEdit = (lab) => { setEditingLab(lab); setShowAddModal(true); setOpenMenuId(null) }

  const handleDelete = async (lab) => {
    setOpenMenuId(null)
    if (!window.confirm(`Delete "${lab.title}"?`)) return
    try {
      await labService.deleteLab(lab.id)
      loadLabs()
    } catch (err) {
      console.error('Failed to delete lab:', err)
    }
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
      const data = { ...payload, createdBy: staffName, updatedBy: staffName }

      const res = editingLab
        ? await labService.updateLab(editingLab.id, data)
        : await labService.createLab(data)

      if (!res.success) throw new Error(res.error)

      setShowAddModal(false)
      setEditingLab(null)
      loadLabs()
    } catch (err) {
      console.error('Failed to save lab:', err)
      alert('Failed to save lab')
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
              <span className="no-content-filter-label">
                Filter {ICONS.chevronDown}
              </span>
              <span className="no-content-filter-sub">
                {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
              </span>
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

          <button className="no-content-icon-btn" aria-label="Add lab" onClick={openAdd}>
            {ICONS.flask}
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
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading labs…</p>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="no-lab-list">
                {paginated.map(l => {
                  const patient = l.patientId ? patientById.get(l.patientId) : null
                  return (
                    <div key={l.id} className="no-lab-card">
                      <div className="no-lab-card-head">
                        {patient?.profilePictureUrl ? (
                          <img src={patient.profilePictureUrl} className="no-lab-av" alt="" />
                        ) : (
                          <div className="no-lab-av no-lab-av--initials" style={{ background: avColorFor(l.patientId || l.id) }}>
                            {l.patientName ? getInitials(...l.patientName.split(' ')) : '—'}
                          </div>
                        )}
                        <div className="no-lab-card-title-wrap">
                          <p className="no-lab-title">{l.title || 'Untitled Lab'}</p>
                          <p className="no-lab-sub">
                            {l.updatedBy ? `Last edited by ${l.updatedBy}` : (l.createdBy ? `Added by ${l.createdBy}` : '—')}
                          </p>
                        </div>
                        <div className="no-lab-menu-wrap">
                          <button className="no-lab-menu-btn" onClick={() => setOpenMenuId(openMenuId === l.id ? null : l.id)} aria-label="Options">
                            {ICONS.dots}
                          </button>
                          {openMenuId === l.id && (
                            <div className="no-lab-menu">
                              <button onClick={() => openEdit(l)}>Edit</button>
                              <button onClick={() => handleDelete(l)} className="danger">Delete</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {summarizeResults(l) && (
                        <div className="no-lab-body">
                          <p className="no-lab-body-label">Results for {l.title}</p>
                          <p className="no-lab-body-text">{summarizeResults(l)}</p>
                        </div>
                      )}

                      <div className="no-lab-footer">
                        <span className="no-lab-patient">
                          {l.patientName || 'Unlinked'}
                          {l.linkedConsultationName && ` · ${l.linkedConsultationName}`}
                        </span>
                        <span className="no-lab-date">{formatDate(l.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No labs found.
                  </p>
                )}
              </div>
            ) : (
              <div className="no-lab-grid">
                {paginated.map(l => (
                  <div key={l.id} className="no-lab-grid-card" onClick={() => openEdit(l)}>
                    <p className="no-lab-title">{l.title || 'Untitled Lab'}</p>
                    <p className="no-lab-sub">{l.patientName || 'Unlinked'}</p>
                    <p className="no-lab-grid-desc">{summarizeResults(l) || 'No results yet'}</p>
                    <p className="no-lab-date">{formatDate(l.createdAt)}</p>
                  </div>
                ))}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No labs found.
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
        <AddLabModal
          patients={patients}
          editingLab={editingLab}
          saving={saving}
          onSubmit={handleSave}
          onClose={() => { setShowAddModal(false); setEditingLab(null) }}
        />
      )}
    </div>
  )
}