// ─────────────────────────────────────────────────────────
// FILE : src/components/AddPatientModal.jsx
// CSS  : src/components/AddPatientModal.css
//
// Create or edit a record in the `patients` collection via
// patientService — matches the real schema from
// patientService.createPatient/updatePatient:
//   firstName, lastName, email, phone, dateOfBirth, gender,
//   height, weight, bmi, allergies[], medications[], medicalHistory[]
//
// Medications/allergies are structured entries (name + dosage/
// form/route/frequency, or name + type/severity/reaction).
//
// Medical History has two shapes now:
//   - Consultation rows carry the diagnosis: diagnosisType,
//     diagnosisName, painLevel, symptoms[]. Each gets a locally
//     generated `id` (array entries have no Firestore doc id of
//     their own) so other rows can reference it.
//   - Every other type (Lab Work/Procedure/Hospitalisation/
//     Emergency/Follow-up) can optionally set
//     linkedConsultationId to point at one of those — you need a
//     consultation before further treatment, so this is how a
//     lab/procedure/hospitalisation says "this is because of
//     that diagnosis."
//
// Typing a name that matches an existing patient and picking
// it puts the modal in edit mode (patientId set); typing a
// name with no match and saving creates a new patient doc.
// ─────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react'
import { linkPatientToAccount } from '../services/api'
import './AddPatientModal.css'

const HISTORY_TYPES = ['Consultation', 'Lab Work', 'Procedure', 'Hospitalisation', 'Emergency', 'Follow-up']
const DIAGNOSIS_TYPES = ['Acute', 'Chronic', 'Recurring', 'Resolved']
const MED_STATUSES = ['active', 'completed', 'discontinued']
const ALLERGY_TYPES = ['Food', 'Drug', 'Environmental', 'Insect', 'Latex', 'Contact', 'Other']
const ALLERGY_SEVERITIES = ['Mild', 'Moderate', 'Severe']
const ALLERGY_STATUSES = ['active', 'historical', 'intolerance']

const ICONS = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pencil: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const genId = () => `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const toDateInputValue = (dateOfBirth) => {
  if (!dateOfBirth) return ''
  const d = dateOfBirth.toDate ? dateOfBirth.toDate() : new Date(dateOfBirth)
  return isNaN(d) ? '' : d.toISOString().split('T')[0]
}

const computeBmi = (heightCm, weightKg) => {
  const h = parseFloat(heightCm), w = parseFloat(weightKg)
  if (!h || !w) return ''
  const m = h / 100
  return (w / (m * m)).toFixed(1)
}

// Tolerates legacy plain-string entries saved before structured fields existed.
const normalizeMed = (m) => typeof m === 'string'
  ? { name: m, dosage: '', form: '', route: '', frequency: '', description: '', status: 'active' }
  : { dosage: '', form: '', route: '', frequency: '', description: '', status: 'active', ...m }

const normalizeAllergy = (a) => typeof a === 'string'
  ? { name: a, type: 'Other', severity: 'Mild', reaction: '', status: 'active' }
  : { type: 'Other', severity: 'Mild', reaction: '', status: 'active', ...a }

// Tolerates legacy flat history rows (no id, no consultation fields).
const normalizeHistory = (h) => ({
  id: h.id || genId(),
  date: h.date || '',
  type: h.type || HISTORY_TYPES[0],
  purpose: h.purpose || h.notes || '',
  diagnosisType: h.diagnosisType || DIAGNOSIS_TYPES[0],
  diagnosisName: h.diagnosisName || '',
  painLevel: h.painLevel ?? '',
  symptoms: h.symptoms || [],
  linkedConsultationId: h.linkedConsultationId || '',
})

const blankMed = { name: '', dosage: '', form: '', route: '', frequency: '', description: '', status: 'active' }
const blankAllergy = { name: '', type: ALLERGY_TYPES[0], severity: ALLERGY_SEVERITIES[0], reaction: '', status: 'active' }
const blankHistory = {
  date: '', type: HISTORY_TYPES[0], purpose: '',
  diagnosisType: DIAGNOSIS_TYPES[0], diagnosisName: '', painLevel: '', symptoms: [],
  linkedConsultationId: '',
}

export default function AddPatientModal({ patients, saving, onSubmit, onClose, initialPatient }) {
  const [nameQuery, setNameQuery]     = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const [selected, setSelected]       = useState(null) // the matched patients-collection row, if editing

  const [dob, setDob]     = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [height, setHeight] = useState('') // cm
  const [weight, setWeight] = useState('') // kg

  const [medForm_, setMedForm_]           = useState(blankMed)
  const [editingMedIndex, setEditingMedIndex] = useState(null)
  const [medications, setMedications]     = useState([])

  const [allergyForm, setAllergyForm]     = useState(blankAllergy)
  const [editingAllergyIndex, setEditingAllergyIndex] = useState(null)
  const [allergies, setAllergies]         = useState([])

  const [historyForm, setHistoryForm]     = useState(blankHistory)
  const [symptomInput, setSymptomInput]   = useState('')
  const [editingHistoryIndex, setEditingHistoryIndex] = useState(null)
  const [medicalHistory, setMedicalHistory] = useState([])

  // ── Manual "link to account" (for records that predate auto-link) ──
  const [linkEmail, setLinkEmail]     = useState('')
  const [linking, setLinking]         = useState(false)
  const [linkError, setLinkError]     = useState('')
  const [linkedUserId, setLinkedUserId] = useState(null) // selected patient.raw?.userId — matches firestore.rules

  const bmi = computeBmi(height, weight)

  const suggestions = useMemo(() => {
    if (!nameQuery.trim()) return []
    return patients
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(nameQuery.toLowerCase()))
      .slice(0, 6)
  }, [nameQuery, patients])

  // Consultations already in this record — the pool "linked consultation" picks from.
  const consultationOptions = medicalHistory.filter(h => h.type === 'Consultation')

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
    setHeight(p.raw?.height || '')
    setWeight(p.raw?.weight || '')
    setMedications((p.medications || []).map(normalizeMed))
    setAllergies((p.allergies || []).map(normalizeAllergy))
    setMedicalHistory((p.medicalHistory || []).map(normalizeHistory))
    setMedForm_(blankMed)
    setEditingMedIndex(null)
    setAllergyForm(blankAllergy)
    setEditingAllergyIndex(null)
    setHistoryForm(blankHistory)
    setEditingHistoryIndex(null)
    setSymptomInput('')
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

  // ── Medications ──────────────────────────────────────────
  const saveMedRow = () => {
    if (!medForm_.name.trim()) return
    const entry = { ...medForm_, name: medForm_.name.trim() }
    setMedications(list => {
      if (editingMedIndex !== null) {
        const copy = [...list]; copy[editingMedIndex] = entry; return copy
      }
      return [...list, entry]
    })
    setEditingMedIndex(null)
    setMedForm_(blankMed)
  }
  const editMedRow = (i) => { setMedForm_(medications[i]); setEditingMedIndex(i) }
  const removeMedRow = (i) => {
    setMedications(list => list.filter((_, idx) => idx !== i))
    if (editingMedIndex === i) { setEditingMedIndex(null); setMedForm_(blankMed) }
  }

  // ── Allergies ────────────────────────────────────────────
  const saveAllergyRow = () => {
    if (!allergyForm.name.trim()) return
    const entry = { ...allergyForm, name: allergyForm.name.trim() }
    setAllergies(list => {
      if (editingAllergyIndex !== null) {
        const copy = [...list]; copy[editingAllergyIndex] = entry; return copy
      }
      return [...list, entry]
    })
    setEditingAllergyIndex(null)
    setAllergyForm(blankAllergy)
  }
  const editAllergyRow = (i) => { setAllergyForm(allergies[i]); setEditingAllergyIndex(i) }
  const removeAllergyRow = (i) => {
    setAllergies(list => list.filter((_, idx) => idx !== i))
    if (editingAllergyIndex === i) { setEditingAllergyIndex(null); setAllergyForm(blankAllergy) }
  }

  // ── Medical History (Consultation + linked follow-ups) ───
  const addSymptom = () => {
    const v = symptomInput.trim()
    if (!v) return
    if (!historyForm.symptoms.some(s => s.toLowerCase() === v.toLowerCase())) {
      setHistoryForm(f => ({ ...f, symptoms: [...f.symptoms, v] }))
    }
    setSymptomInput('')
  }
  const removeSymptom = (v) => setHistoryForm(f => ({ ...f, symptoms: f.symptoms.filter(s => s !== v) }))

  const saveHistoryRow = () => {
    if (!historyForm.date) return
    if (historyForm.type === 'Consultation' && !historyForm.diagnosisName.trim()) return

    const entry = {
      id: editingHistoryIndex !== null ? medicalHistory[editingHistoryIndex].id : genId(),
      date: historyForm.date,
      type: historyForm.type,
      purpose: historyForm.purpose.trim(),
      ...(historyForm.type === 'Consultation'
        ? {
            diagnosisType: historyForm.diagnosisType,
            diagnosisName: historyForm.diagnosisName.trim(),
            painLevel: historyForm.painLevel === '' ? '' : Number(historyForm.painLevel),
            symptoms: historyForm.symptoms,
            linkedConsultationId: '',
          }
        : {
            diagnosisType: '', diagnosisName: '', painLevel: '', symptoms: [],
            linkedConsultationId: historyForm.linkedConsultationId,
          }),
    }

    setMedicalHistory(list => {
      if (editingHistoryIndex !== null) {
        const copy = [...list]; copy[editingHistoryIndex] = entry; return copy
      }
      return [...list, entry]
    })
    setEditingHistoryIndex(null)
    setHistoryForm(blankHistory)
    setSymptomInput('')
  }

  const editHistoryRow = (i) => {
    const item = medicalHistory[i]
    setHistoryForm({
      date: item.date, type: item.type, purpose: item.purpose,
      diagnosisType: item.diagnosisType || DIAGNOSIS_TYPES[0],
      diagnosisName: item.diagnosisName || '',
      painLevel: item.painLevel ?? '',
      symptoms: item.symptoms || [],
      linkedConsultationId: item.linkedConsultationId || '',
    })
    setEditingHistoryIndex(i)
  }

  const removeHistoryRow = (i) => {
    const removedId = medicalHistory[i].id
    setMedicalHistory(list =>
      list
        .filter((_, idx) => idx !== i)
        // Un-link any rows that pointed at a consultation we just removed,
        // rather than leaving a dangling reference.
        .map(h => h.linkedConsultationId === removedId ? { ...h, linkedConsultationId: '' } : h)
    )
    if (editingHistoryIndex === i) {
      setEditingHistoryIndex(null)
      setHistoryForm(blankHistory)
    }
  }

  const historyRowLabel = (h) => {
    if (h.type === 'Consultation') {
      const bits = [h.diagnosisName || 'Undiagnosed', h.diagnosisType]
      if (h.painLevel !== '' && h.painLevel != null) bits.push(`Pain ${h.painLevel}/10`)
      return bits.filter(Boolean).join(' · ')
    }
    const linked = consultationOptions.find(c => c.id === h.linkedConsultationId)
    return [h.purpose || h.type, linked ? `→ ${linked.diagnosisName || 'consultation'}` : null]
      .filter(Boolean).join(' · ')
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
      height,
      weight,
      bmi,
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

        {/* Vitals — height/weight/BMI. Blood type needs a lab result, not
            a manual field — deliberately not collected here. */}
        <div className="apm-field">
          <label className="apm-label">Vitals</label>
          <div className="apm-med-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <input className="apm-input" type="number" placeholder="Height (cm)"
              value={height} onChange={e => setHeight(e.target.value)} />
            <input className="apm-input" type="number" placeholder="Weight (kg)"
              value={weight} onChange={e => setWeight(e.target.value)} />
            <input className="apm-input" placeholder="BMI" value={bmi} disabled />
          </div>
          <p className="apm-hint">Blood type isn't set here — it comes from a lab result once that flow exists.</p>
        </div>

        {/* Medications — name, dosage/form/route/frequency, description, status */}
        <div className="apm-field">
          <div className="apm-field-head">
            <label className="apm-label">Medications</label>
            <button className="apm-add-btn" onClick={saveMedRow}>
              {editingMedIndex !== null ? 'Save row' : 'Add'}
            </button>
          </div>

          <input className="apm-input" placeholder="Medication name" style={{ marginBottom: 8 }}
            value={medForm_.name} onChange={e => setMedForm_(f => ({ ...f, name: e.target.value }))} />

          <div className="apm-med-row">
            <input className="apm-input" placeholder="Dosage (e.g. 500mg)"
              value={medForm_.dosage} onChange={e => setMedForm_(f => ({ ...f, dosage: e.target.value }))} />
            <input className="apm-input" placeholder="Form (e.g. Tablet)"
              value={medForm_.form} onChange={e => setMedForm_(f => ({ ...f, form: e.target.value }))} />
            <input className="apm-input" placeholder="Route (e.g. Oral)"
              value={medForm_.route} onChange={e => setMedForm_(f => ({ ...f, route: e.target.value }))} />
            <input className="apm-input" placeholder="Frequency (e.g. Once Daily)"
              value={medForm_.frequency} onChange={e => setMedForm_(f => ({ ...f, frequency: e.target.value }))} />
          </div>

          <div className="apm-med-row2">
            <input className="apm-input" placeholder="Description (optional)"
              value={medForm_.description} onChange={e => setMedForm_(f => ({ ...f, description: e.target.value }))} />
            <select className="apm-input apm-select" value={medForm_.status}
              onChange={e => setMedForm_(f => ({ ...f, status: e.target.value }))}>
              {MED_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {medications.length > 0 && (
            <div className="apm-history-list">
              {medications.map((m, i) => (
                <div key={i} className="apm-history-item">
                  <span>
                    {m.name}
                    {(m.dosage || m.form || m.route || m.frequency) &&
                      ` · ${[m.dosage, m.form, m.route, m.frequency].filter(Boolean).join(', ')}`}
                    {' '}<em className="apm-status-tag">{m.status}</em>
                  </span>
                  <div className="apm-history-item-actions">
                    <button onClick={() => editMedRow(i)} aria-label="Edit">{ICONS.pencil}</button>
                    <button onClick={() => removeMedRow(i)} aria-label="Remove">{ICONS.close}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical History — Consultations carry the diagnosis; every
            other type can link back to one. */}
        <div className="apm-field">
          <div className="apm-field-head">
            <label className="apm-label">Medical History</label>
            <button className="apm-add-btn" onClick={saveHistoryRow}>
              {editingHistoryIndex !== null ? 'Save row' : 'Add'}
            </button>
          </div>

          <div className="apm-history-row">
            <input className="apm-input" type="date" placeholder="Date"
              value={historyForm.date} onChange={e => setHistoryForm(f => ({ ...f, date: e.target.value }))} />
            <select className="apm-input apm-select" value={historyForm.type}
              onChange={e => setHistoryForm(f => ({ ...f, type: e.target.value }))}>
              {HISTORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className="apm-input" placeholder="Notes (optional)"
              value={historyForm.purpose} onChange={e => setHistoryForm(f => ({ ...f, purpose: e.target.value }))} />
          </div>

          {historyForm.type === 'Consultation' ? (
            <>
              <div className="apm-med-row" style={{ marginTop: 8 }}>
                <input className="apm-input" placeholder="Diagnosis name (e.g. Chronic headache)"
                  style={{ gridColumn: 'span 2' }}
                  value={historyForm.diagnosisName}
                  onChange={e => setHistoryForm(f => ({ ...f, diagnosisName: e.target.value }))} />
                <select className="apm-input apm-select" value={historyForm.diagnosisType}
                  onChange={e => setHistoryForm(f => ({ ...f, diagnosisType: e.target.value }))}>
                  {DIAGNOSIS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input className="apm-input" type="number" min="1" max="10" placeholder="Pain (1–10)"
                  value={historyForm.painLevel}
                  onChange={e => setHistoryForm(f => ({ ...f, painLevel: e.target.value }))} />
              </div>

              <div className="apm-add-row" style={{ marginTop: 8 }}>
                <input className="apm-input" placeholder="Key symptom"
                  value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSymptom() } }} />
                <button className="apm-add-btn apm-add-btn--inline" onClick={addSymptom}>Add</button>
              </div>
              {historyForm.symptoms.length > 0 && (
                <div className="apm-chip-list">
                  {historyForm.symptoms.map(s => (
                    <span key={s} className="apm-chip">
                      {s}
                      <button onClick={() => removeSymptom(s)} aria-label={`Remove ${s}`}>{ICONS.close}</button>
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="apm-field" style={{ marginTop: 8, marginBottom: 0 }}>
              <label className="apm-label">Linked consultation</label>
              <select className="apm-input apm-select" value={historyForm.linkedConsultationId}
                onChange={e => setHistoryForm(f => ({ ...f, linkedConsultationId: e.target.value }))}>
                <option value="">None</option>
                {consultationOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.diagnosisName || 'Untitled'} — {c.date}</option>
                ))}
              </select>
              {consultationOptions.length === 0 && (
                <p className="apm-hint">No consultations added yet — add one first if this follows from a diagnosis.</p>
              )}
            </div>
          )}

          {medicalHistory.length > 0 && (
            <div className="apm-history-list" style={{ marginTop: 10 }}>
              {medicalHistory.map((h, i) => (
                <div key={h.id} className="apm-history-item">
                  <span>{h.date} · {h.type} · {historyRowLabel(h)}</span>
                  <div className="apm-history-item-actions">
                    <button onClick={() => editHistoryRow(i)} aria-label="Edit">{ICONS.pencil}</button>
                    <button onClick={() => removeHistoryRow(i)} aria-label="Remove">{ICONS.close}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Allergies — name, type/severity, reaction, status */}
        <div className="apm-field">
          <div className="apm-field-head">
            <label className="apm-label">Allergies</label>
            <button className="apm-add-btn" onClick={saveAllergyRow}>
              {editingAllergyIndex !== null ? 'Save row' : 'Add'}
            </button>
          </div>

          <input className="apm-input" placeholder="Allergen name" style={{ marginBottom: 8 }}
            value={allergyForm.name} onChange={e => setAllergyForm(f => ({ ...f, name: e.target.value }))} />

          <div className="apm-med-row">
            <select className="apm-input apm-select" value={allergyForm.type}
              onChange={e => setAllergyForm(f => ({ ...f, type: e.target.value }))}>
              {ALLERGY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="apm-input apm-select" value={allergyForm.severity}
              onChange={e => setAllergyForm(f => ({ ...f, severity: e.target.value }))}>
              {ALLERGY_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="apm-input apm-select" value={allergyForm.status}
              onChange={e => setAllergyForm(f => ({ ...f, status: e.target.value }))}>
              {ALLERGY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <input className="apm-input" placeholder="Reaction (optional, e.g. Hives, Swelling)" style={{ marginTop: 8 }}
            value={allergyForm.reaction} onChange={e => setAllergyForm(f => ({ ...f, reaction: e.target.value }))} />

          {allergies.length > 0 && (
            <div className="apm-history-list" style={{ marginTop: 10 }}>
              {allergies.map((a, i) => (
                <div key={i} className="apm-history-item">
                  <span>
                    {a.name} · {a.type} · {a.severity}{' '}
                    <em className="apm-status-tag">{a.status}</em>
                  </span>
                  <div className="apm-history-item-actions">
                    <button onClick={() => editAllergyRow(i)} aria-label="Edit">{ICONS.pencil}</button>
                    <button onClick={() => removeAllergyRow(i)} aria-label="Remove">{ICONS.close}</button>
                  </div>
                </div>
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