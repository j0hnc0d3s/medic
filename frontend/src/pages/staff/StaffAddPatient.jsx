// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/StaffAddPatient.jsx
// CSS  : src/pages/styles/AddPatient.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { patientService } from '../../services'
import '../styles/AddPatient.css'
import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'


const GENDERS = ['Male','Female','Other','Prefer not to say']

const STAFF_NAV = [
  { img: homeImg, path: '/staff/overview', title: 'Home', active: true },
  { img: phoneImg, path: '/staff/messaging', title: 'Messaging', active: false },
  { img: clockImg, path: '/staff/appointments', title: 'Appointments', active: false },
  { img: schedImg, path: '/staff/calendar', title: 'Calendar', active: false },
]

export default function StaffAddPatient() {
  const { patientId } = useParams()
  const navigate      = useNavigate()
  const isEdit        = Boolean(patientId)

  const [loading, setLoading] = useState(isEdit)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({
    firstName:'', lastName:'', dateOfBirth:'', gender:'',
    phone:'', email:'', address:'', medicalHistory:'', notes:'',
  })

  useEffect(() => { if (isEdit) loadPatient() }, [patientId])

  const loadPatient = async () => {
    try {
      const res = await patientService.getPatient(patientId)
      if (res.success) {
        const p = res.patient
        setForm({
          firstName     : p.firstName || '',
          lastName      : p.lastName  || '',
          dateOfBirth   : p.dateOfBirth?.toDate().toISOString().split('T')[0] || '',
          gender        : p.gender || '',
          phone         : p.phone  || '',
          email         : p.email  || '',
          address       : p.address || '',
          medicalHistory: p.medicalHistory || '',
          notes         : p.notes || '',
        })
      } else { alert('Patient not found'); navigate('/staff/patients') }
    } catch (e) { console.error(e); alert('Failed to load patient') }
    setLoading(false)
  }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const validate = () => {
    if (!form.firstName.trim()) { alert('First name is required'); return false }
    if (!form.lastName.trim())  { alert('Last name is required');  return false }
    if (!form.dateOfBirth)      { alert('Date of birth is required'); return false }
    if (!form.phone.trim())     { alert('Phone number is required'); return false }
    return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const data = {
        ...Object.fromEntries(Object.entries(form).map(([k,v]) => [k, typeof v === 'string' ? v.trim() : v])),
        createdBy: 'Admin',
      }
      if (isEdit) {
        const res = await patientService.updatePatient(patientId, { ...data, updatedBy: 'Admin' })
        if (res.success) navigate(`/staff/patients/${patientId}`)
        else alert(`Failed to update: ${res.error}`)
      } else {
        const res = await patientService.createPatient(data)
        if (res.success) navigate(`/staff/patients/${res.patientId}`)
        else alert(`Failed to add: ${res.error}`)
      }
    } catch (e) { console.error(e); alert(`Failed to ${isEdit ? 'update' : 'add'} patient`) }
    setSaving(false)
  }

  if (loading) return <div className="ap-loading"><div className="ap-spinner" /></div>

  return (
    <div className="ap-shell">
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


      <div className="ap-page">
        <h1 className="ap-heading">{isEdit ? 'Edit Patient' : 'Add New Patient'}</h1>

        <form onSubmit={handleSubmit} className="ap-form">

          {/* Personal Info */}
          <div className="ap-card">
            <div className="ap-card-head">
              <p className="ap-card-title">Personal Information</p>
            </div>
            <div className="ap-grid">
              <div className="ap-field">
                <label className="ap-label">First Name <span className="ap-req">*</span></label>
                <input className="ap-input" type="text" name="firstName"
                  value={form.firstName} onChange={handleChange} placeholder="John" required />
              </div>
              <div className="ap-field">
                <label className="ap-label">Last Name <span className="ap-req">*</span></label>
                <input className="ap-input" type="text" name="lastName"
                  value={form.lastName} onChange={handleChange} placeholder="Smith" required />
              </div>
              <div className="ap-field">
                <label className="ap-label">Date of Birth <span className="ap-req">*</span></label>
                <input className="ap-input" type="date" name="dateOfBirth"
                  value={form.dateOfBirth} onChange={handleChange} required />
              </div>
              <div className="ap-field">
                <label className="ap-label">Gender</label>
                <select className="ap-select" name="gender"
                  value={form.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="ap-card">
            <div className="ap-card-head">
              <p className="ap-card-title">Contact Information</p>
            </div>
            <div className="ap-grid">
              <div className="ap-field">
                <label className="ap-label">Phone Number <span className="ap-req">*</span></label>
                <input className="ap-input" type="tel" name="phone"
                  value={form.phone} onChange={handleChange}
                  placeholder="+1 876-555-0123" required />
              </div>
              <div className="ap-field">
                <label className="ap-label">Email</label>
                <input className="ap-input" type="email" name="email"
                  value={form.email} onChange={handleChange}
                  placeholder="john.smith@example.com" />
              </div>
              <div className="ap-field ap-field--full">
                <label className="ap-label">Address</label>
                <input className="ap-input" type="text" name="address"
                  value={form.address} onChange={handleChange}
                  placeholder="123 Main St, Kingston, Jamaica" />
              </div>
            </div>
          </div>

          {/* Medical Info */}
          <div className="ap-card">
            <div className="ap-card-head">
              <p className="ap-card-title">Medical Information</p>
            </div>
            <div className="ap-grid ap-grid--single">
              <div className="ap-field">
                <label className="ap-label">Medical History</label>
                <textarea className="ap-textarea" name="medicalHistory"
                  value={form.medicalHistory} onChange={handleChange} rows={5}
                  placeholder="Conditions, allergies, medications, etc." />
              </div>
              <div className="ap-field">
                <label className="ap-label">Notes</label>
                <textarea className="ap-textarea" name="notes"
                  value={form.notes} onChange={handleChange} rows={4}
                  placeholder="Preferred appointment times, special requirements, etc." />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="ap-actions">
            <button type="button" className="ap-btn ap-btn--ghost" disabled={saving}
              onClick={() => navigate(isEdit ? `/staff/patients/${patientId}` : '/staff/patients')}>
              Cancel
            </button>
            <button type="submit" className="ap-btn ap-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update Patient' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
