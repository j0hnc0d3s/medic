// ─────────────────────────────────────────────────────────
// FILE : src/pages/reception/StaffPatients.jsx
// CSS  : src/pages/staff/NursePatients.css (reused directly -- same
//        .no-* shell/list classes, no need to duplicate the rules)
//
// Receptionist's patient lookup: search + add (same patientService
// + AddPatientModal NursePatients.jsx already uses -- the
// "don't rework what's already working" instruction applies here
// too), trimmed to a single list view (no grid toggle/sort menu,
// since the front desk mostly just needs to find one patient fast)
// and with a "Book appointment" action per row that hands off to
// StaffAppointments.jsx with the patient preselected.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { patientService } from '../../services'
import StaffSidebar from './StaffSidebar'
import AddPatientModal from '../../components/AddPatientModal'
import '../staff/NursePatients.css'

const ICONS = {
  add: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7 1 0 1.9.13 2.75.38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 14v6M14 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
}

const AV_COLORS = ['#2D9C9C', '#1F4788', '#8B5CF6', '#F59E0B', '#6B7280']
const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()
const avColorFor = (id) => AV_COLORS[[...String(id || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]

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

const nameOf = (entry) => typeof entry === 'string' ? entry : (entry?.name || '')

const mapPatientRow = (p) => ({
  id:         p.id,
  firstName:  p.firstName || '',
  lastName:   p.lastName  || '',
  gender:     p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : 'Unknown',
  age:        calculateAge(p.dateOfBirth),
  dob:        p.dateOfBirth || null,
  email:      p.email || '—',
  phone:      p.phone || '',
  image:      null,
  medications: (p.medications || []).map(nameOf).filter(Boolean),
  allergies:   (p.allergies || []).map(nameOf).filter(Boolean),
  medicalHistory: p.medicalHistory || [],
  createdAt:  p.createdAt?.toDate ? p.createdAt.toDate() : (p.createdAt ? new Date(p.createdAt) : null),
})

export default function StaffPatients() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()

  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
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
    return [...patients]
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
        || p.phone.includes(search))
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
  }, [patients, search])

  const handleAddPatient = async (payload) => {
    const { patientId, firstName, lastName, dob, email, phone, medications, allergies, medicalHistory } = payload
    if (!firstName) return

    setSaving(true)
    try {
      const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Reception'
      const data = { firstName, lastName, email, phone, dateOfBirth: dob || null, medications, allergies, medicalHistory }

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

  const bookFor = (p, e) => {
    e.stopPropagation()
    navigate('/reception/appointments', {
      state: { prefillPatient: { patientId: p.id, patientName: `${p.firstName} ${p.lastName}`, patientPhone: p.phone } },
    })
  }

  return (
    <div className="no-shell">
      <StaffSidebar />

      <div className="no-main">
        <div className="no-content-header">
          <input className="no-content-search" placeholder="Search by name or phone"
            value={search} onChange={e => setSearch(e.target.value)} />

          <button className="no-content-icon-btn" aria-label="Add patient"
            onClick={() => { setEditingPatient(null); setShowAddModal(true) }}>
            {ICONS.add}
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading patients…</p>
        ) : (
          <div className="no-patient-list">
            {filtered.map(p => (
              <div key={p.id} className="no-patient-row no-patient-row--clickable"
                onClick={() => { setEditingPatient(p); setShowAddModal(true) }}>
                <div className="no-patient-row-av no-patient-row-av--initials" style={{ background: avColorFor(p.id) }}>
                  {getInitials(p.firstName, p.lastName)}
                </div>

                <div className="no-patient-row-name">
                  <p className="no-patient-row-name-text">{p.firstName} {p.lastName}</p>
                  <p className="no-patient-row-meta">{p.gender}, {p.age ?? '—'}</p>
                </div>

                <div className="no-patient-row-col">
                  <p className="no-patient-row-col-label">Date of Birth</p>
                  <p className="no-patient-row-col-value">{formatDOB(p.dob)}</p>
                </div>

                <div className="no-patient-row-col">
                  <p className="no-patient-row-col-label">Phone</p>
                  <p className="no-patient-row-col-value">{p.phone || '—'}</p>
                </div>

                <div className="no-patient-row-col">
                  <p className="no-patient-row-col-label">Email</p>
                  <p className="no-patient-row-col-value no-patient-row-col-value--truncate">{p.email}</p>
                </div>

                <button
                  style={{
                    flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#2D9C9C',
                    background: 'transparent', border: '1px solid #2D9C9C', borderRadius: 20,
                    padding: '6px 14px', cursor: 'pointer',
                  }}
                  onClick={(e) => bookFor(p, e)}
                >
                  Book appointment
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '40px 0' }}>
                No patients found.
              </p>
            )}
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
