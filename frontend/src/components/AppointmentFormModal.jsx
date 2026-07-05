import { useState, useEffect, useMemo } from 'react'
import './FormModal.css'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import patientService from '../services/patientService'

const TYPES = ['General Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Procedure']
const STATUSES = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']

const labelize = (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const ICONS = {
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

export default function AppointmentFormModal({ mode = 'add', initial = null, onSubmit, onClose }) {
  const empty = {
    patientName: '', patientPhone: '', patientId: null, patientRecordId: null,
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '', type: '', doctor: '', status: 'scheduled', notes: '',
  }
  const [values, setValues] = useState({ ...empty, ...initial })
  const [doctors, setDoctors] = useState([])

  // ── Real patient picker — an appointment has to actually link to
  //    a patient record (patientId), not just a free-text name.
  //    Without it, notificationService.sendAppointmentReminder never
  //    fires and the patient's own appointment list has nothing
  //    reliable to match against.
  const [patients, setPatients] = useState([])
  const [patientQuery, setPatientQuery] = useState(initial?.patientName || '')
  const [showSuggest, setShowSuggest] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  useEffect(() => {
    patientService.getPatients().then(res => {
      if (res.success) setPatients(res.patients || [])
    }).catch(() => setPatients([]))
  }, [])

  // If editing an appointment that already has a patientRecordId,
  // resolve it against the loaded list so the field shows as
  // properly linked rather than just displaying the stored name.
  useEffect(() => {
    if (!initial?.patientRecordId || !patients.length) return
    const match = patients.find(p => p.id === initial.patientRecordId)
    if (match) setSelectedPatient(match)
  }, [initial?.patientRecordId, patients])

  useEffect(() => { setValues({ ...empty, ...initial }); setPatientTouched(false) }, [initial])

  const setField = (key, val) => setValues(v => ({ ...v, [key]: val }))

  // Only true once the person actually starts typing to change the
  // patient — lets editing an existing appointment (including older
  // ones saved before patientRecordId existed, which will never
  // resolve to a selectedPatient) go through untouched, while still
  // requiring a real match for anything newly typed.
  const [patientTouched, setPatientTouched] = useState(false)

  const suggestions = useMemo(() => {
    if (!patientQuery.trim()) return []
    return patients
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientQuery.toLowerCase()))
      .slice(0, 6)
  }, [patientQuery, patients])

  const pickPatient = (p) => {
    setSelectedPatient(p)
    setPatientQuery(`${p.firstName} ${p.lastName}`)
    // patientId here means "linked Auth account" — that's what
    // notificationService/PatientAppointments look up by. Not every
    // patient record has one yet (walk-ins without an app account),
    // so this can legitimately be null; patientRecordId (the
    // patients-collection doc id) is what actually proves this
    // appointment is tied to a real patient in the system.
    setField('patientId', p.userId || null)
    setField('patientRecordId', p.id)
    setField('patientName', `${p.firstName} ${p.lastName}`)
    setField('patientPhone', p.phone || values.patientPhone)
    setShowSuggest(false)
  }

  const handleSave = () => {
    if (!canSave) return
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

  // Editing something untouched (patient-wise) is always allowed to
  // save, regardless of whether it resolved to a real record — it
  // already had a name before, and we're not changing that here.
  // Adding new, or actively re-picking the patient on an edit, still
  // requires a genuine match.
  const patientOk = (mode === 'edit' && !patientTouched) || !!selectedPatient
  const canSave = patientOk && !!values.appointmentDate && !!values.appointmentTime

  return (
    <div className="no-modal-backdrop" onClick={onClose}>
      <div className="no-modal-card" onClick={e => e.stopPropagation()}>
        <div className="no-modal-head">
          <h2 className="no-modal-title">{mode === 'edit' ? 'Edit' : 'New'} Appointment</h2>
          <button className="no-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="no-modal-body">
          <div className="no-form-row">
            <div className="no-form-field half" style={{ position: 'relative' }}>
              <label className="no-form-label">Patient *</label>
              <input
                className="no-form-input"
                placeholder="Search patients…"
                value={patientQuery}
                onChange={e => {
                  setPatientTouched(true)
                  setPatientQuery(e.target.value)
                  setSelectedPatient(null)
                  setField('patientId', null)
                  setField('patientRecordId', null)
                  setShowSuggest(true)
                }}
                onFocus={() => setShowSuggest(true)}
              />
              <span style={{ position: 'absolute', right: 16, top: 38, color: '#9ca3af', pointerEvents: 'none' }}>
                {ICONS.chevronDown}
              </span>

              {showSuggest && suggestions.length > 0 && (
                <div className="no-form-suggest-list">
                  {suggestions.map(p => (
                    <button key={p.uid || p.id} type="button" className="no-form-suggest-item"
                      onClick={() => pickPatient(p)}>
                      {p.firstName} {p.lastName}
                    </button>
                  ))}
                </div>
              )}

              {patientTouched && !selectedPatient && patientQuery.trim() && suggestions.length === 0 && (
                <p className="no-form-hint no-form-hint--error">
                  No matching patient found — add them from the Patients tab first.
                </p>
              )}
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
          <button className="no-modal-btn save" disabled={!canSave} onClick={handleSave}>
            {mode === 'edit' ? 'Update' : 'Create'} Appointment
          </button>
        </div>
      </div>
    </div>
  )
}