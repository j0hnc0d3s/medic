// ─────────────────────────────────────────────────────────
// FILE : src/components/AddPatientModal.jsx
// CSS  : src/components/AddPatientModal.css
//
// Create or edit a record in the `patients` collection via
// patientService — matches the real schema from
// patientService.createPatient/updatePatient:
//   firstName, lastName, email, phone, dateOfBirth, gender,
//   allergies[], medications[], medicalHistory[]
//
// Typing a name that matches an existing patient and picking
// it puts the modal in edit mode (patientId set); typing a
// name with no match and saving creates a new patient doc.
// Everything here is plain fields/arrays on that one doc — no
// separate Firestore reads/writes needed per field.
// ─────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react'
import { linkPatientToAccount } from '../services/api'
import './AddPatientModal.css'

const HISTORY_TYPES = ['Consultation', 'Lab Work', 'Procedure', 'Hospitalisation', 'Emergency', 'Follow-up']

const ICONS = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pencil: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const toDateInputValue = (dateOfBirth) => {
  if (!dateOfBirth) return ''
  const d = dateOfBirth.toDate ? dateOfBirth.toDate() : new Date(dateOfBirth)
  return isNaN(d) ? '' : d.toISOString().split('T')[0]
}

export default function AddPatientModal({ patients, saving, onSubmit, onClose, initialPatient }) {
  const [nameQuery, setNameQuery]     = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const [selected, setSelected]       = useState(null) // the matched patients-collection row, if editing

  const [dob, setDob]     = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [medicationInput, setMedicationInput] = useState('')
  const [medications, setMedications]         = useState([])

  const [allergyInput, setAllergyInput] = useState('')
  const [allergies, setAllergies]       = useState([])

  const [historyDate, setHistoryDate]       = useState('')
  const [historyType, setHistoryType]       = useState(HISTORY_TYPES[0])
  const [historyPurpose, setHistoryPurpose] = useState('')
  const [editingHistoryIndex, setEditingHistoryIndex] = useState(null)
  const [medicalHistory, setMedicalHistory] = useState([])

  // ── Manual "link to account" (for records that predate auto-link) ──
  const [linkEmail, setLinkEmail]     = useState('')
  const [linking, setLinking]         = useState(false)
  const [linkError, setLinkError]     = useState('')
  const [linkedUserId, setLinkedUserId] = useState(null) // selected patient.raw?.userId — matches firestore.rules

  const suggestions = useMemo(() => {
    if (!nameQuery.trim()) return []
    return patients
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(nameQuery.toLowerCase()))
      .slice(0, 6)
  }, [nameQuery, patients])

  useEffect(() => {
    if (initialPatient) pickPatient(initialPatient)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatient])

  // Everything we need is already on the row from patientService.getPatients()
  // — no extra fetch required.
  const pickPatient = (p) => {
    setSelected(p)
    setNameQuery(`${p.firstName} ${p.lastName}`)
    setDob(toDateInputValue(p.dob))
    setEmail(p.email && p.email !== '—' ? p.email : '')
    setPhone(p.phone || '')
    setMedications(p.medications || [])
    setAllergies(p.allergies || [])
    setMedicalHistory((p.medicalHistory || []).map(h => ({
      date: h.date || '', type: h.type || HISTORY_TYPES[0], purpose: h.purpose || h.notes || '',
    })))
    setLinkedUserId(p.raw?.userId || null)
    setLinkEmail('')
    setLinkError('')
    setShowSuggest(false)
  }

  const handleLinkAccount = async () => {
    if (!selected || !linkEmail.trim()) return
    setLinking(true)
    setLinkError('')
    try {
      const res = await linkPatientToAccount(selected.id, linkEmail.trim())
      setLinkedUserId(res.uid)
      setLinkEmail('')
    } catch (err) {
      setLinkError(err.message || 'Failed to link.')
    } finally {
      setLinking(false)
    }
  }

  const addAllergy = () => {
    const v = allergyInput.trim()
    if (!v) return
    if (!allergies.some(a => a.toLowerCase() === v.toLowerCase())) {
      setAllergies(a => [...a, v])
    }
    setAllergyInput('')
  }
  const removeAllergy = (v) => setAllergies(a => a.filter(x => x !== v))

  const addMedication = () => {
    const v = medicationInput.trim()
    if (!v) return
    if (!medications.some(m => m.toLowerCase() === v.toLowerCase())) {
      setMedications(m => [...m, v])
    }
    setMedicationInput('')
  }
  const removeMedication = (v) => setMedications(m => m.filter(x => x !== v))

  const addHistoryRow = () => {
    if (!historyDate || !historyPurpose.trim()) return
    const row = { date: historyDate, type: historyType, purpose: historyPurpose.trim() }
    setMedicalHistory(h => {
      if (editingHistoryIndex !== null) {
        const copy = [...h]
        copy[editingHistoryIndex] = row
        return copy
      }
      return [...h, row]
    })
    setEditingHistoryIndex(null)
    setHistoryDate('')
    setHistoryType(HISTORY_TYPES[0])
    setHistoryPurpose('')
  }

  const editHistoryRow = (i) => {
    const item = medicalHistory[i]
    setHistoryDate(item.date)
    setHistoryType(item.type)
    setHistoryPurpose(item.purpose)
    setEditingHistoryIndex(i)
  }

  const removeHistoryRow = (i) => {
    setMedicalHistory(h => h.filter((_, idx) => idx !== i))
    if (editingHistoryIndex === i) {
      setEditingHistoryIndex(null)
      setHistoryDate(''); setHistoryPurpose('')
    }
  }

  const canSave = nameQuery.trim().length > 0 && !saving

  const handleSave = () => {
    if (!canSave) return
    const [firstName, ...rest] = nameQuery.trim().split(/\s+/)
    const lastName = rest.join(' ')

    onSubmit({
      patientId: selected?.id || null,
      firstName,
      lastName,
      dob,
      email,
      phone,
      medications,
      allergies,
      medicalHistory,
    })
  }

  return (
    <div className="apm-backdrop" onClick={onClose}>
      <div className="apm-modal" onClick={e => e.stopPropagation()}>
        <div className="apm-head">
          <h2 className="apm-title">{selected ? 'Edit Patient' : 'Add Patient'}</h2>
          <button className="apm-close" onClick={onClose} aria-label="Close">
            {ICONS.close}
          </button>
        </div>

        {/* Patient name — pick an existing record to edit, or type a new one */}
        <div className="apm-field">
          <label className="apm-label">Patient name</label>
          <div className="apm-select-wrap">
            <input
              className="apm-input"
              placeholder="Enter patient name"
              value={nameQuery}
              onChange={e => { setNameQuery(e.target.value); setSelected(null); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)}
            />
            <span className="apm-select-chevron">{ICONS.chevronDown}</span>

            {showSuggest && suggestions.length > 0 && (
              <div className="apm-suggest-list">
                {suggestions.map(p => (
                  <button key={p.id} className="apm-suggest-item" onClick={() => pickPatient(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!selected && nameQuery.trim() && (
            <p className="apm-hint">No match — saving will create a new patient record.</p>
          )}
        </div>

        {/* DOB + Email */}
        <div className="apm-row-2">
          <div className="apm-field">
            <label className="apm-label">Date of Birth</label>
            <input className="apm-input" type="date"
              value={dob} onChange={e => setDob(e.target.value)} />
          </div>
          <div className="apm-field">
            <label className="apm-label">Email</label>
            <input className="apm-input" placeholder="e.g. josiahjohngreen@gmail.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="apm-field">
          <label className="apm-label">Phone</label>
          <input className="apm-input" placeholder="e.g. (876) 555-0100"
            value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        {/* Medications — existing + new, all editable/removable */}
        <div className="apm-field">
          <label className="apm-label">Medications</label>
          <div className="apm-add-row">
            <input className="apm-input" placeholder="Enter medications"
              value={medicationInput}
              onChange={e => setMedicationInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMedication() } }} />
            <button className="apm-add-btn apm-add-btn--inline" onClick={addMedication}>Add</button>
          </div>

          {medications.length > 0 && (
            <div className="apm-chip-list">
              {medications.map(m => (
                <span key={m} className="apm-chip">
                  {m}
                  <button onClick={() => removeMedication(m)} aria-label={`Remove ${m}`}>{ICONS.close}</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Medical History — existing rows are editable/removable */}
        <div className="apm-field">
          <div className="apm-field-head">
            <label className="apm-label">Medical History</label>
            <button className="apm-add-btn" onClick={addHistoryRow}>
              {editingHistoryIndex !== null ? 'Save row' : 'Add'}
            </button>
          </div>

          <div className="apm-history-row">
            <input className="apm-input" type="date" placeholder="Date"
              value={historyDate} onChange={e => setHistoryDate(e.target.value)} />
            <select className="apm-input apm-select" value={historyType}
              onChange={e => setHistoryType(e.target.value)}>
              {HISTORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="apm-input" placeholder="Purpose"
              value={historyPurpose} onChange={e => setHistoryPurpose(e.target.value)} />
          </div>

          {medicalHistory.length > 0 && (
            <div className="apm-history-list">
              {medicalHistory.map((h, i) => (
                <div key={i} className="apm-history-item">
                  <span>{h.date} · {h.type} · {h.purpose}</span>
                  <div className="apm-history-item-actions">
                    <button onClick={() => editHistoryRow(i)} aria-label="Edit">{ICONS.pencil}</button>
                    <button onClick={() => removeHistoryRow(i)} aria-label="Remove">{ICONS.close}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Allergies — existing + new, all editable/removable */}
        <div className="apm-field">
          <label className="apm-label">Allergies</label>
          <div className="apm-add-row">
            <input className="apm-input" placeholder="Enter allergies"
              value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy() } }} />
            <button className="apm-add-btn apm-add-btn--inline" onClick={addAllergy}>Add</button>
          </div>

          {allergies.length > 0 && (
            <div className="apm-chip-list">
              {allergies.map(a => (
                <span key={a} className="apm-chip">
                  {a}
                  <button onClick={() => removeAllergy(a)} aria-label={`Remove ${a}`}>{ICONS.close}</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Link to account — only relevant once a record exists */}
        {selected && (
          <div className="apm-field">
            <label className="apm-label">Login account</label>
            {linkedUserId ? (
              <p className="apm-hint apm-hint--linked">✓ Linked to an account — data will show on their Overview screen.</p>
            ) : (
              <>
                <div className="apm-add-row">
                  <input className="apm-input" placeholder="Patient's account email"
                    value={linkEmail} onChange={e => setLinkEmail(e.target.value)} />
                  <button className="apm-add-btn apm-add-btn--inline" onClick={handleLinkAccount} disabled={linking}>
                    {linking ? 'Linking…' : 'Link'}
                  </button>
                </div>
                {linkError && <p className="apm-hint apm-hint--error">{linkError}</p>}
                <p className="apm-hint">Not linked yet — matches by email automatically when they sign up, or link manually here now.</p>
              </>
            )}
          </div>
        )}

        <div className="apm-footer">
          <button className="apm-btn apm-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="apm-btn apm-btn--save" disabled={!canSave} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}