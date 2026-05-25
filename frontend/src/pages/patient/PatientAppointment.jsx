// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientAppointment.jsx
// CSS  : src/pages/styles/Appointment.css
// ─────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../styles/Appointment.css'

import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'
import downImg  from '../../assets/images/down.png'
import timeImg  from '../../assets/images/time.png'

const SIDEBAR_NAV = [
  { img: homeImg,  path: '/patient/overview',     title: 'Home',         active: false },
  { img: phoneImg, path: '/patient/messaging',    title: 'Messaging',    active: false },
  { img: clockImg, path: '/patient/appointments', title: 'Appointments', active: true  },
  { img: schedImg, path: '/patient/calendar',     title: 'Calendar',     active: false },
]

const TYPES      = ['General Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Procedure']
const DOCTORS    = ['Dr. Sarah Mitchell', 'Dr. James Wilson', 'Dr. Paula Chen']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const DURATIONS  = ['15 mins', '30 mins', '45 mins', '1 hour', '1.5 hours', '2 hours']

export default function PatientAppointment() {
  const { userProfile, loading } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    patientName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : '',
    doctor: '',
    patientPhone: userProfile?.phone || '',
    appointmentDate: '',
    appointmentTime: '',
    duration: '',
    reason: '',
    type: '',
    priority: 'Medium',
    patientNotes: '',
    specialistNotes: '',
  })

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = () => {
    console.log('Save appointment:', formData)
    navigate('/patient/appointments')
  }

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

      {/* ── Form page ────────────────────────────── */}
      <div className="appt-page">
        <div className="appt-form-page">

          <h1 className="appt-form-heading">New Appointment</h1>

          {/* Row 1: Patient Info + Appointment Info */}
          <div className="appt-form-row">

            {/* Patient Information */}
            <div className="appt-form-card">
              <div className="appt-form-card-head">
                <p className="appt-form-card-title">Patient Information</p>
                <p className="appt-form-card-sub">Enter the patient's details below</p>
              </div>

              <div className="appt-form-fields">
                <div className="appt-form-field-row">
                  <div className="appt-form-field">
                    <label className="appt-field-label">Patient Name</label>
                    <div className="appt-field-input">
                      <input className="appt-field-text" name="patientName"
                        value={formData.patientName} onChange={handleChange}
                        placeholder="e.g. John Smith" />
                      <img src={downImg} alt="" className="appt-field-icon" />
                    </div>
                  </div>
                  <div className="appt-form-field">
                    <label className="appt-field-label">Assign Doctor</label>
                    <div className="appt-field-input">
                      <select className="appt-field-select" name="doctor"
                        value={formData.doctor} onChange={handleChange}>
                        <option value="">Select doctor</option>
                        {DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <img src={downImg} alt="" className="appt-field-icon" />
                    </div>
                  </div>
                </div>

                <div className="appt-form-field-row">
                  <div className="appt-form-field">
                    <label className="appt-field-label">Phone Number</label>
                    <div className="appt-field-input">
                      <input className="appt-field-text" name="patientPhone" type="tel"
                        value={formData.patientPhone} onChange={handleChange}
                        placeholder="e.g. +1 (876) 123-4567" />
                    </div>
                  </div>
                </div>

                <div className="appt-form-field-row">
                  <div className="appt-form-field">
                    <label className="appt-field-label">Date</label>
                    <div className="appt-field-input">
                      <input className="appt-field-text" name="appointmentDate" type="date"
                        value={formData.appointmentDate} onChange={handleChange} />
                      <img src={schedImg} alt="" className="appt-field-icon" />
                    </div>
                  </div>
                  <div className="appt-form-field">
                    <label className="appt-field-label">Time</label>
                    <div className="appt-field-input">
                      <input className="appt-field-text" name="appointmentTime" type="time"
                        value={formData.appointmentTime} onChange={handleChange} />
                      <img src={timeImg} alt="" className="appt-field-icon" />
                    </div>
                  </div>
                  <div className="appt-form-field">
                    <label className="appt-field-label">Duration</label>
                    <div className="appt-field-input">
                      <select className="appt-field-select" name="duration"
                        value={formData.duration} onChange={handleChange}>
                        <option value="">e.g. 30 mins</option>
                        {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <img src={timeImg} alt="" className="appt-field-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Information */}
            <div className="appt-form-card">
              <div className="appt-form-card-head">
                <p className="appt-form-card-title">Appointment Information</p>
                <p className="appt-form-card-sub">Enter the appointment details below</p>
              </div>

              <div className="appt-form-fields">
                <div className="appt-form-field-row">
                  <div className="appt-form-field appt-form-field--full">
                    <label className="appt-field-label">Reason</label>
                    <div className="appt-field-input">
                      <input className="appt-field-text" name="reason"
                        value={formData.reason} onChange={handleChange}
                        placeholder="e.g. I had a stroke" />
                    </div>
                  </div>
                </div>

                <div className="appt-form-field-row">
                  <div className="appt-form-field">
                    <label className="appt-field-label">Type</label>
                    <div className="appt-field-input">
                      <select className="appt-field-select" name="type"
                        value={formData.type} onChange={handleChange}>
                        <option value="">Select type</option>
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <img src={downImg} alt="" className="appt-field-icon" />
                    </div>
                  </div>
                  <div className="appt-form-field">
                    <label className="appt-field-label">Priority</label>
                    <div className="appt-field-input">
                      <select className="appt-field-select" name="priority"
                        value={formData.priority} onChange={handleChange}>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <img src={downImg} alt="" className="appt-field-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Additional Information */}
          <div className="appt-form-card">
            <div className="appt-form-card-head">
              <p className="appt-form-card-title">Additional Information</p>
              <p className="appt-form-card-sub">Enter additional details below</p>
            </div>

            <div className="appt-form-field-row">
              <div className="appt-form-field appt-form-field--full">
                <label className="appt-field-label">Patient Notes</label>
                <div className="appt-field-input appt-field-input--tall">
                  <textarea className="appt-field-textarea" name="patientNotes"
                    value={formData.patientNotes} onChange={handleChange}
                    placeholder="e.g. I feel sick" />
                </div>
              </div>
              <div className="appt-form-field appt-form-field--full">
                <label className="appt-field-label">Specialist Notes</label>
                <div className="appt-field-input appt-field-input--tall">
                  <textarea className="appt-field-textarea" name="specialistNotes"
                    value={formData.specialistNotes} onChange={handleChange}
                    placeholder="Specialist observations..." />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom action buttons */}
          <div className="appt-form-actions">
            <button className="appt-form-cancel"
              onClick={() => navigate('/patient/appointments')}>
              Cancel
            </button>
            <button className="appt-form-save" onClick={handleSave}>
              Save Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
