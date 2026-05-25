// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientAppointments.jsx
// CSS  : src/pages/styles/Appointment.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, orderBy, Timestamp,
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import '../styles/Appointment.css'

import homeImg   from '../../assets/images/home.png'
import phoneImg  from '../../assets/images/phone.png'
import clockImg  from '../../assets/images/clock.png'
import schedImg  from '../../assets/images/schedule.png'
import searchImg from '../../assets/images/search.png'
import addImg    from '../../assets/images/plus.png'
import downImg   from '../../assets/images/down.png'

const SIDEBAR_NAV = [
  { img: homeImg,  path: '/patient/overview',     title: 'Home',         active: false },
  { img: phoneImg, path: '/patient/messaging',    title: 'Messaging',    active: false },
  { img: clockImg, path: '/patient/appointments', title: 'Appointments', active: true  },
  { img: schedImg, path: '/patient/calendar',     title: 'Calendar',     active: false },
]

const TYPES    = ['General Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Procedure']
const DOCTORS  = ['Dr. Sarah Mitchell', 'Dr. James Wilson', 'Dr. Paula Chen']
const STATUSES = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']

const STATUS_COLORS = {
  scheduled   : '#F59E0B',
  confirmed   : '#3B82F6',
  'in-progress': '#2D9C9C',
  completed   : '#22C55E',
  cancelled   : '#EF4444',
  'no-show'   : '#6B7280',
}

const fmtDate = ts => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const fmtStatus = s =>
  (s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const DATE_FILTERS   = ['all', 'today', 'upcoming', 'past']
const STATUS_FILTERS = ['all', ...STATUSES]

export default function PatientAppointments() {
  const navigate = useNavigate()

  const [appointments,  setAppointments]  = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [editingAppt,   setEditingAppt]   = useState(null)
  const [filterStatus,  setFilterStatus]  = useState('all')
  const [filterDate,    setFilterDate]    = useState('all')

  const [formData, setFormData] = useState({
    patientName: '', patientPhone: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '', type: '', doctor: '',
    status: 'scheduled', notes: '',
  })

  useEffect(() => { loadAppointments() }, [])

  const loadAppointments = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'appointments'), orderBy('appointmentDate', 'desc')))
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

  const resetForm = () => {
    setFormData({
      patientName: '', patientPhone: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '', type: '', doctor: '',
      status: 'scheduled', notes: '',
    })
    setEditingAppt(null)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.patientName.trim()) return alert('Patient name is required')
    try {
      const data = {
        ...formData,
        patientName: formData.patientName.trim(),
        appointmentDate: Timestamp.fromDate(new Date(formData.appointmentDate)),
        updatedAt: Timestamp.now(),
      }
      if (editingAppt) {
        await updateDoc(doc(db, 'appointments', editingAppt.id), data)
      } else {
        data.createdAt = Timestamp.now()
        await addDoc(collection(db, 'appointments'), data)
      }
      setShowModal(false); resetForm(); loadAppointments()
    } catch (e) { console.error(e); alert('Failed to save appointment') }
  }

  const handleEdit = appt => {
    setEditingAppt(appt)
    setFormData({
      patientName: appt.patientName || '',
      patientPhone: appt.patientPhone || '',
      appointmentDate: appt.appointmentDate?.toDate().toISOString().split('T')[0] || '',
      appointmentTime: appt.appointmentTime || '',
      type: appt.type || '', doctor: appt.doctor || '',
      status: appt.status || 'scheduled', notes: appt.notes || '',
    })
    setShowModal(true)
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this appointment?')) return
    try { await deleteDoc(doc(db, 'appointments', id)); loadAppointments() }
    catch (e) { console.error(e) }
  }

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status, updatedAt: Timestamp.now() })
      loadAppointments()
    } catch (e) { console.error(e) }
  }

  const filtered = appointments.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    let matchDate = true
    if (filterDate === 'today') {
      matchDate = a.appointmentDate?.toDate().toDateString() === new Date().toDateString()
    } else if (filterDate === 'upcoming') {
      matchDate = a.appointmentDate?.toDate() >= new Date()
    } else if (filterDate === 'past') {
      matchDate = a.appointmentDate?.toDate() < new Date()
    }
    return matchStatus && matchDate
  })

  if (loading) return (
    <div className="appt-shell">
      <div className="appt-loading"><div className="appt-spinner" /></div>
    </div>
  )

  return (
    <div className="appt-shell">

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="pv-aside">
        {SIDEBAR_NAV.map(({ img, path, title, active }) => (
          <button key={title} title={title} aria-label={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}>
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </aside>

      {/* ── Page ─────────────────────────────────── */}
      <div className="appt-page">

        {/* Search + filter bar */}
        <div className="appt-bar">
          <div className="appt-search">
            <img src={searchImg} alt="Search" className="appt-search-icon" />
            <span className="appt-search-text">Search appointments</span>
          </div>

          <div className="appt-bar-right">
            {/* Date filter pills */}
            <div className="appt-pills">
              {DATE_FILTERS.map(f => (
                <button key={f}
                  onClick={() => setFilterDate(f)}
                  className={`appt-pill${filterDate === f ? ' active' : ''}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Status dropdown */}
            <div className="appt-select-wrap">
              <select
                className="appt-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}>
                {STATUS_FILTERS.map(s => (
                  <option key={s} value={s}>{fmtStatus(s) || 'All Statuses'}</option>
                ))}
              </select>
              <img src={downImg} alt="" className="appt-select-icon" />
            </div>

            {/* Book button */}
            <button
              className="appt-book-btn"
              onClick={() => navigate('/patient/appointment')}>
              <img src={addImg} alt="" className="appt-book-icon" />
              Book Appointment
            </button>
          </div>
        </div>

        {/* List */}
        {filtered.length > 0 ? (
          <div className="appt-list">
            {filtered.map(appt => {
              const color = STATUS_COLORS[appt.status] || '#6B7280'
              return (
                <div key={appt.id} className="appt-card">
                  <div className="appt-card-left">
                    <div className="appt-card-date">{fmtDate(appt.appointmentDate)}</div>
                    {appt.appointmentTime && (
                      <div className="appt-card-time">{appt.appointmentTime}</div>
                    )}
                  </div>

                  <div className="appt-card-body">
                    <p className="appt-card-name">{appt.patientName}</p>
                    {appt.patientPhone && (
                      <p className="appt-card-phone">{appt.patientPhone}</p>
                    )}
                    <div className="appt-card-tags">
                      {appt.type   && <span className="appt-tag">{appt.type}</span>}
                      {appt.doctor && <span className="appt-tag">{appt.doctor}</span>}
                    </div>
                    {appt.notes && <p className="appt-card-notes">{appt.notes}</p>}
                  </div>

                  <div className="appt-card-right">
                    <span className="appt-status-badge"
                      style={{ background: `${color}18`, color }}>
                      {fmtStatus(appt.status)}
                    </span>

                    <div className="appt-card-actions">
                      {appt.status === 'scheduled'   && <button className="appt-action-btn confirm" onClick={() => updateStatus(appt.id, 'confirmed')}>Confirm</button>}
                      {appt.status === 'confirmed'   && <button className="appt-action-btn start"   onClick={() => updateStatus(appt.id, 'in-progress')}>Start</button>}
                      {appt.status === 'in-progress' && <button className="appt-action-btn complete" onClick={() => updateStatus(appt.id, 'completed')}>Complete</button>}
                      <button className="appt-action-btn edit"   onClick={() => handleEdit(appt)}>Edit</button>
                      <button className="appt-action-btn delete" onClick={() => handleDelete(appt.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="appt-empty">
            <img src={schedImg} alt="" className="appt-empty-img" />
            <p className="appt-empty-title">No appointments found</p>
            <p className="appt-empty-sub">Nothing to see here.</p>
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────── */}
      {showModal && (
        <div className="appt-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="appt-modal" onClick={e => e.stopPropagation()}>
            <div className="appt-modal-head">
              <h2 className="appt-modal-title">
                {editingAppt ? 'Edit Appointment' : 'New Appointment'}
              </h2>
              <button className="appt-modal-close" onClick={() => { setShowModal(false); resetForm() }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="appt-modal-body">
                <div className="appt-form-grid">
                  {[
                    { label: 'Patient Name *', name: 'patientName', type: 'text',  required: true },
                    { label: 'Phone',          name: 'patientPhone', type: 'tel'  },
                    { label: 'Date *',         name: 'appointmentDate', type: 'date', required: true },
                    { label: 'Time *',         name: 'appointmentTime', type: 'time', required: true },
                  ].map(f => (
                    <div key={f.name} className="appt-form-group">
                      <label className="appt-form-label">{f.label}</label>
                      <input type={f.type} name={f.name} required={f.required}
                        className="appt-form-input" value={formData[f.name]}
                        onChange={handleChange} />
                    </div>
                  ))}

                  <div className="appt-form-group">
                    <label className="appt-form-label">Type</label>
                    <select name="type" className="appt-form-select"
                      value={formData.type} onChange={handleChange}>
                      <option value="">Select type</option>
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="appt-form-group">
                    <label className="appt-form-label">Doctor</label>
                    <select name="doctor" className="appt-form-select"
                      value={formData.doctor} onChange={handleChange}>
                      <option value="">Select doctor</option>
                      {DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="appt-form-group">
                    <label className="appt-form-label">Status</label>
                    <select name="status" className="appt-form-select"
                      value={formData.status} onChange={handleChange}>
                      {STATUSES.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
                    </select>
                  </div>

                  <div className="appt-form-group appt-form-full">
                    <label className="appt-form-label">Notes</label>
                    <textarea name="notes" className="appt-form-textarea"
                      value={formData.notes} onChange={handleChange}
                      rows={3} placeholder="Additional notes..." />
                  </div>
                </div>
              </div>

              <div className="appt-modal-foot">
                <button type="button" className="appt-modal-cancel"
                  onClick={() => { setShowModal(false); resetForm() }}>Cancel</button>
                <button type="submit" className="appt-modal-confirm">
                  {editingAppt ? 'Update' : 'Create'} Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
