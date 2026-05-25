// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/StaffPatients.jsx
// CSS  : src/pages/styles/Patients.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientService } from '../../services'
import '../styles/Patients.css'
import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'


const AV_COLORS = ['#2D9C9C','#FF6B6B','#1F4788','#F59E0B','#8B5CF6']
const getInitials = (f, l) => `${f?.[0]||''}${l?.[0]||''}`.toUpperCase()
const getAv = i => AV_COLORS[i % AV_COLORS.length]

const fmtDate = ts => {
  if (!ts) return 'Never'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const FILTER_OPTS = [
  { value: 'all',      label: 'All Patients'         },
  { value: 'week',     label: 'Visited This Week'     },
  { value: 'month',    label: 'Visited This Month'    },
  { value: 'inactive', label: 'Inactive (3+ months)'  },
]

const STAFF_NAV = [
  { img: homeImg, path: '/staff/overview', title: 'Home', active: true },
  { img: phoneImg, path: '/staff/messaging', title: 'Messaging', active: false },
  { img: clockImg, path: '/staff/appointments', title: 'Appointments', active: false },
  { img: schedImg, path: '/staff/calendar', title: 'Calendar', active: false },
]

export default function StaffPatients() {
  const navigate = useNavigate()
  const [patients,  setPatients]  = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { loadPatients() }, [])
  useEffect(() => { applyFilters() }, [search, filter, patients])

  const loadPatients = async () => {
    try {
      const res = await patientService.getPatients()
      if (res.success) setPatients(res.patients)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const applyFilters = () => {
    let list = [...patients]
    if (search) {
      const t = search.toLowerCase()
      list = list.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(t) ||
        p.phone?.toLowerCase().includes(t) ||
        p.email?.toLowerCase().includes(t)
      )
    }
    if (filter !== 'all') {
      const now = new Date()
      list = list.filter(p => {
        if (!p.visits?.length) return false
        const last = p.visits[p.visits.length - 1].date.toDate()
        if (filter === 'week')     return last >= new Date(now - 7*86400000)
        if (filter === 'month')    return last >= new Date(now - 30*86400000)
        if (filter === 'inactive') return last < new Date(now - 90*86400000)
        return true
      })
    }
    setFiltered(list)
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this patient? This cannot be undone.')) return
    const res = await patientService.deletePatient(id)
    if (res.success) setPatients(p => p.filter(x => x.id !== id))
    else alert(`Failed: ${res.error}`)
  }

  const exportCSV = () => {
    const rows = filtered.map(p => [
      p.firstName, p.lastName, fmtDate(p.dateOfBirth),
      p.phone||'', p.email||'', p.address||''
    ])
    const csv = [
      ['First Name','Last Name','Date of Birth','Phone','Email','Address'],
      ...rows
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n')

    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getLastVisit = p =>
    p.visits?.length ? p.visits[p.visits.length - 1].date : null

  if (loading) return (
    <div className="pts-loading"><div className="pts-spinner" /></div>
  )

  return (
    <div className="pts-shell">
      {/* ── Left icon sidebar ──────────────────────── */}
      <aside className="pv-aside">
        {STAFF_NAV.map(({ img, path, title, active }) => (
          <button key={title} title={title} aria-label={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}>
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </aside>


      {/* ── Bar ──────────────────────────────────── */}
      <div className="pts-bar">
        <div className="pts-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="pts-search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="pts-search-input"
            placeholder="Search by name, phone, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="pts-bar-right">
          <div className="pts-select-wrap">
            <select className="pts-select" value={filter} onChange={e => setFilter(e.target.value)}>
              {FILTER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <button className="pts-btn pts-btn--ghost" onClick={exportCSV}>Export CSV</button>
          <button className="pts-btn pts-btn--primary" onClick={() => navigate('/staff/addpatient')}>
            + Add Patient
          </button>
        </div>
      </div>

      {/* ── Count ─────────────────────────────────── */}
      <p className="pts-count">
        {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* ── Table ─────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="pts-table-wrap">
          <table className="pts-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date of Birth</th>
                <th>Phone</th>
                <th>Last Visit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <div className="pts-cell">
                      <div className="pts-av" style={{ background: getAv(i) }}>
                        {getInitials(p.firstName, p.lastName)}
                      </div>
                      <span className="pts-name">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>
                  <td>{fmtDate(p.dateOfBirth)}</td>
                  <td>{p.phone || '—'}</td>
                  <td>{fmtDate(getLastVisit(p))}</td>
                  <td>
                    <div className="pts-actions">
                      <button className="pts-action-btn"
                        onClick={() => navigate(`/staff/patients/${p.id}`)}>View</button>
                      <button className="pts-action-btn"
                        onClick={() => navigate(`/staff/patients/${p.id}/edit`)}>Edit</button>
                      <button className="pts-action-btn pts-action-btn--delete"
                        onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pts-empty">
          <span className="pts-empty-icon">👥</span>
          <p className="pts-empty-title">No patients found</p>
          <p className="pts-empty-sub">
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Add your first patient to get started'}
          </p>
        </div>
      )}
    </div>
  )
}
