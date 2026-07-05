// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NursePatients.jsx
// CSS  : src/pages/staff/NursePatients.css
//
// Structured the same way as NurseAppointments.jsx: a search +
// filter header, a real-data list fed by a service call, and a
// modal for the create/write flow — here patientService instead
// of appointmentService, operating on the `patients` collection.
//
// Note: this is a separate collection from `users` (the
// Auth-linked login accounts) — patientService.createPatient/
// updatePatient/getPatients all read and write `patients` docs
// directly (firstName, lastName, dateOfBirth, allergies,
// medications, medicalHistory as plain fields/arrays). This tab
// doesn't touch a patient's own login/portal data.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { patientService } from '../../services'
import NurseSidebar from './NurseSidebar'
import AdminSidebar from './AdminSidebar'
import AddPatientModal from '../../components/AddPatientModal'
import './NursePatients.css'

const ICONS = {
  add:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7 1 0 1.9.13 2.75.38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 14v6M14 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  grid:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  list:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const SORT_OPTIONS = [
  { key: 'patient', label: 'by patient' },
  { key: 'recent',  label: 'by recent'  },
  { key: 'age',     label: 'by age'     },
]

const AV_COLORS = ['#2D9C9C', '#1F4788', '#8B5CF6', '#F59E0B', '#6B7280']
const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()
const avColorFor = (id) => AV_COLORS[[...String(id || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]

// patientService stores dateOfBirth as a Firestore Timestamp (or null) —
// these helpers accept a Timestamp, a plain Date, or a date string.
const toDate = (val) => {
  if (!val) return null
  const d = val.toDate ? val.toDate() : new Date(val)
  return isNaN(d) ? null : d
}

const calculateAge = (dob) => {
  const birth = toDate(dob)
  if (!birth) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const formatDOB = (dob) => {
  const d = toDate(dob)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Allergy/medication entries are usually plain strings on this
// collection, but tolerate richer {name} objects too.
const nameOf = (entry) => typeof entry === 'string' ? entry : (entry?.name || '')

const mapPatientRow = (p) => ({
  id:            p.id,
  firstName:     p.firstName || '',
  lastName:      p.lastName  || '',
  gender:        p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : 'Unknown',
  age:           calculateAge(p.dateOfBirth),
  dob:           p.dateOfBirth || null,
  email:         p.email || '—',
  phone:         p.phone || '',
  image:         null, // patients collection has no profile photo field
  medications:   (p.medications || []).map(nameOf).filter(Boolean),
  allergies:     (p.allergies || []).map(nameOf).filter(Boolean),
  medicalHistory: p.medicalHistory || [],
  createdAt:     p.createdAt?.toDate ? p.createdAt.toDate() : (p.createdAt ? new Date(p.createdAt) : null),
  raw:           p,
})

const PAGE_SIZE = 6

export default function NursePatients() {
  const { userProfile } = useAuth()

  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sortBy, setSortBy]     = useState('patient')
  const [showSort, setShowSort] = useState(false)
  const [viewMode, setViewMode] = useState('list') // list | grid
  const [page, setPage]         = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => { loadPatients() }, [])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const res = await patientService.getPatients()
      if (res.success) setPatients((res.patients || []).map(mapPatientRow))
    } catch (err) {
      console.error('Failed to load patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === 'patient') {
      list = [...list].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
    } else if (sortBy === 'recent') {
      list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    } else if (sortBy === 'age') {
      list = [...list].sort((a, b) => (b.age ?? -1) - (a.age ?? -1))
    }
    return list
  }, [patients, search, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search, sortBy])

  // ── Save from AddPatientModal ────────────────────────────
  // patientService.updatePatient does a plain updateDoc (no deep
  // merge), so the arrays the modal sends are the final state —
  // exactly matching what the modal shows (edits/removals included).
  const handleAddPatient = async (payload) => {
    const { patientId, firstName, lastName, dob, email, phone, height, weight, bmi, medications, allergies, medicalHistory } = payload
    if (!firstName) return

    setSaving(true)
    try {
      const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'

      const data = {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dob || null,
        height,
        weight,
        bmi,
        medications,
        allergies,
        medicalHistory,
      }

      if (patientId) {
        const res = await patientService.updatePatient(patientId, { ...data, updatedBy: staffName })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await patientService.createPatient({ ...data, createdBy: staffName })
        if (!res.success) throw new Error(res.error)
      }

      setShowAddModal(false)
      setEditingPatient(null)
      loadPatients()
    } catch (err) {
      console.error('Failed to save patient:', err)
      alert('Failed to save patient')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="no-shell">
      {userProfile?.role === 'admin' ? <AdminSidebar /> : <NurseSidebar />}

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

          <button className="no-content-icon-btn" aria-label="Add patient"
            onClick={() => { setEditingPatient(null); setShowAddModal(true) }}>
            {ICONS.add}
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
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading patients…</p>
        ) : (
          <>
            {viewMode === 'list' ? (
              <div className="no-patient-list">
                {paginated.map(p => (
                  <div key={p.id} className="no-patient-row no-patient-row--clickable"
                    onClick={() => { setEditingPatient(p); setShowAddModal(true) }}>
                    {p.image ? (
                      <img src={p.image} className="no-patient-row-av" alt="" />
                    ) : (
                      <div className="no-patient-row-av no-patient-row-av--initials"
                        style={{ background: avColorFor(p.id) }}>
                        {getInitials(p.firstName, p.lastName)}
                      </div>
                    )}

                    <div className="no-patient-row-name">
                      <p className="no-patient-row-name-text">{p.firstName} {p.lastName}</p>
                      <p className="no-patient-row-meta">{p.gender}, {p.age ?? '—'}</p>
                    </div>

                    <div className="no-patient-row-col">
                      <p className="no-patient-row-col-label">Date of Birth</p>
                      <p className="no-patient-row-col-value">{formatDOB(p.dob)}</p>
                    </div>

                    <div className="no-patient-row-col">
                      <p className="no-patient-row-col-label">Email</p>
                      <p className="no-patient-row-col-value no-patient-row-col-value--truncate">{p.email}</p>
                    </div>

                    <div className="no-patient-row-col">
                      <p className="no-patient-row-col-label">Medications</p>
                      <p className="no-patient-row-col-value">
                        {p.medications.length > 0 ? p.medications.join(', ') : '—'}
                      </p>
                    </div>

                    <div className="no-patient-row-col">
                      <p className="no-patient-row-col-label">Allergies</p>
                      <p className="no-patient-row-col-value">
                        {p.allergies.length > 0 ? p.allergies.join(', ') : '—'}
                      </p>
                    </div>
                  </div>
                ))}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No patients found.
                  </p>
                )}
              </div>
            ) : (
              <div className="no-patient-grid">
                {paginated.map(p => (
                  <div key={p.id} className="no-patient-card no-patient-row--clickable"
                    onClick={() => { setEditingPatient(p); setShowAddModal(true) }}>
                    {p.image ? (
                      <img src={p.image} className="no-patient-card-av" alt="" />
                    ) : (
                      <div className="no-patient-card-av no-patient-row-av--initials"
                        style={{ background: avColorFor(p.id) }}>
                        {getInitials(p.firstName, p.lastName)}
                      </div>
                    )}
                    <p className="no-patient-card-name">{p.firstName} {p.lastName}</p>
                    <p className="no-patient-card-meta">{p.gender}, {p.age ?? '—'}</p>
                    <div className="no-patient-card-row"><span>DOB</span><span>{formatDOB(p.dob)}</span></div>
                    <div className="no-patient-card-row"><span>Email</span><span className="no-patient-row-col-value--truncate">{p.email}</span></div>
                    <div className="no-patient-card-row"><span>Meds</span><span>{p.medications.length || 0}</span></div>
                    <div className="no-patient-card-row"><span>Allergies</span><span>{p.allergies.length || 0}</span></div>
                  </div>
                ))}

                {paginated.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                    No patients found.
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
        <AddPatientModal
          patients={patients}
          initialPatient={editingPatient}
          saving={saving}
          onSubmit={handleAddPatient}
          onClose={() => { setShowAddModal(false); setEditingPatient(null) }}
        />
      )}
    </div>
  )
}
