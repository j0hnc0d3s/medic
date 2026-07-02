import { useState, useEffect } from 'react'
import './FormModal.css'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'

const TYPES = ['General Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Procedure']
const STATUSES = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']

const labelize = (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

export default function AppointmentFormModal({ mode = 'add', initial = null, onSubmit, onClose }) {
  const empty = {
    patientName: '', patientPhone: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '', type: '', doctor: '', status: 'scheduled', notes: '',
  }
  const [values, setValues] = useState({ ...empty, ...initial })
  const [doctors, setDoctors] = useState([])

  useEffect(() => { setValues({ ...empty, ...initial }) }, [initial])

  const setField = (key, val) => setValues(v => ({ ...v, [key]: val }))

  const handleSave = () => {
    if (!values.patientName.trim() || !values.appointmentDate || !values.appointmentTime) return
    onSubmit?.(values)
    onClose()
  }
  
  useEffect(() => {
    getDocs(query(collection(db, 'users'), where('role', '==', 'doctor')))
      .then(snap => {
        setDoctors(snap.docs.map(d => {
          const { firstName, lastName } = d.data()
          return `Dr. ${firstName} ${lastName}`
        }))
      })
      .catch(() => setDoctors([]))
  }, [])

  return (
    <div className="no-modal-backdrop" onClick={onClose}>
      <div className="no-modal-card" onClick={e => e.stopPropagation()}>
        <div className="no-modal-head">
          <h2 className="no-modal-title">{mode === 'edit' ? 'Edit' : 'New'} Appointment</h2>
          <button className="no-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="no-modal-body">
          <div className="no-form-row">
            <div className="no-form-field half">
              <label className="no-form-label">Patient Name *</label>
              <input className="no-form-input" value={values.patientName} onChange={e => setField('patientName', e.target.value)} />
            </div>
            <div className="no-form-field half">
              <label className="no-form-label">Phone</label>
              <input className="no-form-input" type="tel" value={values.patientPhone} onChange={e => setField('patientPhone', e.target.value)} />
            </div>
          </div>

          <div className="no-form-row">
            <div className="no-form-field half">
              <label className="no-form-label">Date *</label>
              <input className="no-form-input" type="date" value={values.appointmentDate} onChange={e => setField('appointmentDate', e.target.value)} />
            </div>
            <div className="no-form-field half">
              <label className="no-form-label">Time *</label>
              <input className="no-form-input" type="time" value={values.appointmentTime} onChange={e => setField('appointmentTime', e.target.value)} />
            </div>
          </div>

          <div className="no-form-row">
            <div className="no-form-field half">
              <label className="no-form-label">Type</label>
              <div className="no-form-select-wrap">
                <select className="no-form-input no-form-select" value={values.type} onChange={e => setField('type', e.target.value)}>
                  <option value="">Select type</option>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="no-form-field half">
              <label className="no-form-label">Doctor</label>
              <div className="no-form-select-wrap">
                <select className="no-form-input no-form-select" value={values.doctor} onChange={e => setField('doctor', e.target.value)}>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                  {doctors.length === 0 && <option value="">No doctors on file</option>}
                </select>
              </div>
            </div>
          </div>

          {mode === 'edit' && (
            <div className="no-form-field">
              <label className="no-form-label">Status</label>
              <div className="no-form-select-wrap">
                <select className="no-form-input no-form-select" value={values.status} onChange={e => setField('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{labelize(s)}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="no-form-field">
            <label className="no-form-label">Notes</label>
            <textarea className="no-form-input no-form-textarea" placeholder="Additional notes or instructions..."
              value={values.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>

        <div className="no-modal-footer">
          <button className="no-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="no-modal-btn save" onClick={handleSave}>{mode === 'edit' ? 'Update' : 'Create'} Appointment</button>
        </div>
      </div>
    </div>
  )
}