// ─────────────────────────────────────────────────────────
// FILE : src/components/AddLabModal.jsx
// CSS  : src/components/AddLabModal.css
//
// Create or edit a `labs` collection record via labService.
//
// Test type drives a fully custom set of result fields — a Blood
// Pressure reading needs systolic/diastolic, a Lipid Panel needs
// four separate values, an X-Ray needs a findings/impression
// narrative, etc. See TEST_FIELDS below for every template.
//
// A lab can't exist without being tied to a specific Consultation
// on the linked patient — that's the whole reason a test got
// ordered. If the picked patient has no Consultation on record yet,
// saving is blocked with a message pointing at the Patients tab.
//
// The file drop zone uploads through documentService (the same
// Storage-backed upload used elsewhere) and stores the resulting
// URL/id on the lab record, rather than duplicating upload logic.
// ─────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react'
import documentService from '../services/documentService'
import { useAuth } from '../contexts/AuthContext'
import './AddLabModal.css'

const ICONS = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  upload: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M8 8l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// ── Every test type's result fields ────────────────────────
// type: 'number' | 'text' | 'textarea' | 'select'
const TEST_FIELDS = {
  // ── Vital Signs ──
  'Blood Pressure': [
    { key: 'systolic',  label: 'Systolic',  type: 'number', unit: 'mmHg' },
    { key: 'diastolic', label: 'Diastolic', type: 'number', unit: 'mmHg' },
  ],
  'Heart Rate / Pulse': [
    { key: 'bpm', label: 'Heart Rate', type: 'number', unit: 'bpm' },
  ],
  'Temperature': [
    { key: 'value', label: 'Temperature', type: 'number', unit: '°' },
    { key: 'unit',  label: 'Unit', type: 'select', options: ['°F', '°C'] },
  ],
  'Respiratory Rate': [
    { key: 'breathsPerMin', label: 'Respiratory Rate', type: 'number', unit: 'breaths/min' },
  ],
  'Oxygen Saturation (SpO2)': [
    { key: 'percentage', label: 'SpO2', type: 'number', unit: '%' },
  ],
  'Blood Glucose': [
    { key: 'value',   label: 'Glucose', type: 'number', unit: 'mg/dL' },
    { key: 'context', label: 'Context', type: 'select', options: ['Fasting', 'Random', 'Post-meal'] },
  ],

  // ── Blood Tests ──
  'Complete Blood Count (CBC)': [
    { key: 'wbc',        label: 'WBC',        type: 'number', unit: 'x10³/µL' },
    { key: 'rbc',        label: 'RBC',        type: 'number', unit: 'x10⁶/µL' },
    { key: 'hemoglobin', label: 'Hemoglobin', type: 'number', unit: 'g/dL' },
    { key: 'hematocrit', label: 'Hematocrit', type: 'number', unit: '%' },
    { key: 'platelets',  label: 'Platelets',  type: 'number', unit: 'x10³/µL' },
  ],
  'Basic Metabolic Panel (BMP)': [
    { key: 'glucose',    label: 'Glucose',    type: 'number', unit: 'mg/dL' },
    { key: 'bun',        label: 'BUN',        type: 'number', unit: 'mg/dL' },
    { key: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL' },
    { key: 'sodium',     label: 'Sodium',     type: 'number', unit: 'mEq/L' },
    { key: 'potassium',  label: 'Potassium',  type: 'number', unit: 'mEq/L' },
    { key: 'chloride',   label: 'Chloride',   type: 'number', unit: 'mEq/L' },
    { key: 'co2',        label: 'CO2',        type: 'number', unit: 'mEq/L' },
    { key: 'calcium',    label: 'Calcium',    type: 'number', unit: 'mg/dL' },
  ],
  'Comprehensive Metabolic Panel (CMP)': [
    { key: 'glucose',    label: 'Glucose',    type: 'number', unit: 'mg/dL' },
    { key: 'bun',        label: 'BUN',        type: 'number', unit: 'mg/dL' },
    { key: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL' },
    { key: 'sodium',     label: 'Sodium',     type: 'number', unit: 'mEq/L' },
    { key: 'potassium',  label: 'Potassium',  type: 'number', unit: 'mEq/L' },
    { key: 'chloride',   label: 'Chloride',   type: 'number', unit: 'mEq/L' },
    { key: 'co2',        label: 'CO2',        type: 'number', unit: 'mEq/L' },
    { key: 'calcium',    label: 'Calcium',    type: 'number', unit: 'mg/dL' },
    { key: 'albumin',    label: 'Albumin',    type: 'number', unit: 'g/dL' },
    { key: 'totalProtein', label: 'Total Protein', type: 'number', unit: 'g/dL' },
    { key: 'alt',        label: 'ALT',        type: 'number', unit: 'U/L' },
    { key: 'ast',        label: 'AST',        type: 'number', unit: 'U/L' },
    { key: 'alp',        label: 'Alkaline Phosphatase', type: 'number', unit: 'U/L' },
    { key: 'bilirubin',  label: 'Bilirubin',  type: 'number', unit: 'mg/dL' },
  ],
  'Lipid Panel': [
    { key: 'totalCholesterol', label: 'Total Cholesterol', type: 'number', unit: 'mg/dL' },
    { key: 'ldl',              label: 'LDL',               type: 'number', unit: 'mg/dL' },
    { key: 'hdl',              label: 'HDL',               type: 'number', unit: 'mg/dL' },
    { key: 'triglycerides',    label: 'Triglycerides',     type: 'number', unit: 'mg/dL' },
  ],
  'Liver Function Test (LFT)': [
    { key: 'alt',       label: 'ALT',       type: 'number', unit: 'U/L' },
    { key: 'ast',       label: 'AST',       type: 'number', unit: 'U/L' },
    { key: 'alp',       label: 'Alkaline Phosphatase', type: 'number', unit: 'U/L' },
    { key: 'bilirubin', label: 'Bilirubin', type: 'number', unit: 'mg/dL' },
    { key: 'albumin',   label: 'Albumin',   type: 'number', unit: 'g/dL' },
  ],
  'Kidney Function Test': [
    { key: 'bun',        label: 'BUN',        type: 'number', unit: 'mg/dL' },
    { key: 'creatinine', label: 'Creatinine', type: 'number', unit: 'mg/dL' },
    { key: 'egfr',       label: 'eGFR',       type: 'number', unit: 'mL/min/1.73m²' },
  ],
  'Thyroid Function Test (TSH)': [
    { key: 'tsh', label: 'TSH', type: 'number', unit: 'mIU/L' },
    { key: 't3',  label: 'T3',  type: 'number', unit: 'ng/dL' },
    { key: 't4',  label: 'T4',  type: 'number', unit: 'µg/dL' },
  ],
  'Hemoglobin A1c (HbA1c)': [
    { key: 'percentage', label: 'HbA1c', type: 'number', unit: '%' },
  ],
  'Coagulation Panel (PT/INR)': [
    { key: 'pt',  label: 'PT',  type: 'number', unit: 'sec' },
    { key: 'inr', label: 'INR', type: 'number', unit: 'ratio' },
    { key: 'ptt', label: 'PTT', type: 'number', unit: 'sec' },
  ],
  'Blood Type & Crossmatch': [
    { key: 'bloodType', label: 'Blood Type', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { key: 'crossmatch', label: 'Crossmatch Result', type: 'select', options: ['Compatible', 'Incompatible'] },
  ],
  'Electrolyte Panel': [
    { key: 'sodium',    label: 'Sodium',    type: 'number', unit: 'mEq/L' },
    { key: 'potassium', label: 'Potassium', type: 'number', unit: 'mEq/L' },
    { key: 'chloride',  label: 'Chloride',  type: 'number', unit: 'mEq/L' },
    { key: 'co2',       label: 'CO2',       type: 'number', unit: 'mEq/L' },
  ],

  // ── Urine Tests ──
  'Urinalysis (UA)': [
    { key: 'color',          label: 'Color',           type: 'text' },
    { key: 'clarity',        label: 'Clarity',         type: 'select', options: ['Clear', 'Cloudy'] },
    { key: 'ph',             label: 'pH',              type: 'number' },
    { key: 'specificGravity',label: 'Specific Gravity',type: 'number' },
    { key: 'protein',        label: 'Protein',         type: 'select', options: ['Negative', 'Trace', '1+', '2+', '3+'] },
    { key: 'glucose',        label: 'Glucose',         type: 'select', options: ['Negative', 'Positive'] },
    { key: 'ketones',        label: 'Ketones',         type: 'select', options: ['Negative', 'Positive'] },
    { key: 'blood',          label: 'Blood',           type: 'select', options: ['Negative', 'Positive'] },
    { key: 'leukocytes',     label: 'Leukocytes',      type: 'select', options: ['Negative', 'Positive'] },
    { key: 'nitrites',       label: 'Nitrites',        type: 'select', options: ['Negative', 'Positive'] },
  ],
  'Urine Culture': [
    { key: 'organism',    label: 'Organism',    type: 'text' },
    { key: 'colonyCount', label: 'Colony Count',type: 'text' },
    { key: 'sensitivity', label: 'Sensitivity',  type: 'textarea' },
  ],
  'Pregnancy Test (Urine hCG)': [
    { key: 'result', label: 'Result', type: 'select', options: ['Positive', 'Negative'] },
  ],

  // ── Imaging ──
  'X-Ray':      [ { key: 'findings', label: 'Findings', type: 'textarea' }, { key: 'impression', label: 'Impression', type: 'textarea' } ],
  'MRI':        [ { key: 'findings', label: 'Findings', type: 'textarea' }, { key: 'impression', label: 'Impression', type: 'textarea' } ],
  'CT Scan':    [ { key: 'findings', label: 'Findings', type: 'textarea' }, { key: 'impression', label: 'Impression', type: 'textarea' } ],
  'Ultrasound': [ { key: 'findings', label: 'Findings', type: 'textarea' }, { key: 'impression', label: 'Impression', type: 'textarea' } ],
  'Mammogram': [
    { key: 'biradsCategory', label: 'BI-RADS Category', type: 'select', options: ['0', '1', '2', '3', '4', '5', '6'] },
    { key: 'findings',   label: 'Findings',   type: 'textarea' },
    { key: 'impression', label: 'Impression', type: 'textarea' },
  ],

  // ── Cardiac ──
  'ECG / EKG': [
    { key: 'rhythm',   label: 'Rhythm',   type: 'text' },
    { key: 'rate',     label: 'Rate',     type: 'number', unit: 'bpm' },
    { key: 'interval', label: 'Intervals (PR/QRS/QT)', type: 'text' },
    { key: 'findings', label: 'Findings', type: 'textarea' },
  ],
  'Echocardiogram': [
    { key: 'ejectionFraction', label: 'Ejection Fraction', type: 'number', unit: '%' },
    { key: 'findings',         label: 'Findings',          type: 'textarea' },
  ],
  'Stress Test': [
    { key: 'duration',     label: 'Duration',       type: 'text' },
    { key: 'maxHeartRate', label: 'Max Heart Rate', type: 'number', unit: 'bpm' },
    { key: 'result',       label: 'Result',         type: 'select', options: ['Normal', 'Abnormal'] },
    { key: 'findings',     label: 'Findings',       type: 'textarea' },
  ],

  // ── Microbiology ──
  'Blood Culture': [
    { key: 'organism',    label: 'Organism',    type: 'text' },
    { key: 'result',      label: 'Result',      type: 'select', options: ['No growth', 'Positive'] },
    { key: 'sensitivity', label: 'Sensitivity', type: 'textarea' },
  ],
  'Throat Culture': [
    { key: 'organism', label: 'Organism', type: 'text' },
    { key: 'result',   label: 'Result',   type: 'select', options: ['Negative', 'Positive'] },
  ],
  'Wound Culture': [
    { key: 'organism',    label: 'Organism',    type: 'text' },
    { key: 'sensitivity', label: 'Sensitivity', type: 'textarea' },
  ],

  // ── Other ──
  'Biopsy': [
    { key: 'findings',  label: 'Findings',  type: 'textarea' },
    { key: 'diagnosis', label: 'Diagnosis', type: 'text' },
  ],
  'Allergy Test': [
    { key: 'allergen', label: 'Allergen', type: 'text' },
    { key: 'result',   label: 'Result',   type: 'select', options: ['Negative', 'Positive'] },
    { key: 'severity', label: 'Severity', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
  ],
  'COVID-19 Test': [
    { key: 'testType', label: 'Test Type', type: 'select', options: ['PCR', 'Antigen'] },
    { key: 'result',   label: 'Result',    type: 'select', options: ['Positive', 'Negative'] },
  ],
}

const LAB_CATEGORIES = {
  'Vital Signs':  ['Blood Pressure', 'Heart Rate / Pulse', 'Temperature', 'Respiratory Rate', 'Oxygen Saturation (SpO2)', 'Blood Glucose'],
  'Blood Tests':  ['Complete Blood Count (CBC)', 'Basic Metabolic Panel (BMP)', 'Comprehensive Metabolic Panel (CMP)', 'Lipid Panel', 'Liver Function Test (LFT)', 'Kidney Function Test', 'Thyroid Function Test (TSH)', 'Hemoglobin A1c (HbA1c)', 'Coagulation Panel (PT/INR)', 'Blood Type & Crossmatch', 'Electrolyte Panel'],
  'Urine Tests':  ['Urinalysis (UA)', 'Urine Culture', 'Pregnancy Test (Urine hCG)'],
  'Imaging':      ['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Mammogram'],
  'Cardiac':      ['ECG / EKG', 'Echocardiogram', 'Stress Test'],
  'Microbiology': ['Blood Culture', 'Throat Culture', 'Wound Culture'],
  'Other':        ['Biopsy', 'Allergy Test', 'COVID-19 Test'],
}

const CUSTOM_VALUE = '__custom__'

const categoryOf = (typeName) => {
  for (const [cat, types] of Object.entries(LAB_CATEGORIES)) {
    if (types.includes(typeName)) return cat
  }
  return 'Other'
}

export default function AddLabModal({ patients, editingLab, saving, onSubmit, onClose }) {
  const { userProfile } = useAuth()

  const [labType, setLabType]         = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [results, setResults]         = useState({}) // { fieldKey: value }
  const [customNotes, setCustomNotes] = useState('') // free notes when labType is Custom

  const [patientQuery, setPatientQuery]     = useState('')
  const [showSuggest, setShowSuggest]       = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [linkedConsultationId, setLinkedConsultationId] = useState('')

  const [file, setFile]           = useState(null)
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [existingFileName, setExistingFileName] = useState(null)

  useEffect(() => {
    if (!editingLab) return
    const isKnownType = Object.values(LAB_CATEGORIES).flat().includes(editingLab.title)
    if (isKnownType) {
      setLabType(editingLab.title)
    } else if (editingLab.title) {
      setLabType(CUSTOM_VALUE)
      setCustomTitle(editingLab.title)
    }
    setResults(editingLab.results || {})
    setCustomNotes(editingLab.notes || editingLab.description || '')
    setPatientQuery(editingLab.patientName || '')
    setLinkedConsultationId(editingLab.linkedConsultationId || '')
    setExistingFileName(editingLab.fileName || null)
    if (editingLab.patientId) {
      const match = patients.find(p => p.id === editingLab.patientId)
      if (match) setSelectedPatient(match)
    }
  }, [editingLab, patients])

  const suggestions = useMemo(() => {
    if (!patientQuery.trim()) return []
    return patients
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientQuery.toLowerCase()))
      .slice(0, 6)
  }, [patientQuery, patients])

  // A lab can't exist without a Consultation on the linked patient —
  // that's what a test is ordered because of.
  const patientConsultations = useMemo(() => {
    if (!selectedPatient) return []
    return (selectedPatient.medicalHistory || [])
      .filter(h => h.type === 'Consultation')
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [selectedPatient])

  const pickPatient = (p) => {
    setSelectedPatient(p)
    setPatientQuery(`${p.firstName} ${p.lastName}`)
    setLinkedConsultationId('') // reset — consultations are per-patient
    setShowSuggest(false)
  }

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setExistingFileName(null)
  }

  const setResultField = (key, value) => setResults(r => ({ ...r, [key]: value }))

  const finalTitle = labType === CUSTOM_VALUE ? customTitle.trim() : labType
  const activeFields = labType && labType !== CUSTOM_VALUE ? (TEST_FIELDS[labType] || []) : []

  const canSave = finalTitle.length > 0
    && !!selectedPatient
    && !!linkedConsultationId
    && !saving && !uploading

  const handleSave = async () => {
    if (!canSave) return

    let documentId = editingLab?.documentId || null
    let fileUrl    = editingLab?.fileUrl || null
    let fileName   = editingLab?.fileName || null

    if (file) {
      setUploading(true)
      try {
        const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
        const res = await documentService.uploadDocument(file, {
          name: `${finalTitle} — ${selectedPatient.firstName} ${selectedPatient.lastName}`,
          category: 'Lab Result',
          uploadedBy: staffName,
        })
        if (res.success) {
          documentId = res.documentId
          fileUrl = res.url
          fileName = file.name
        }
      } catch (err) {
        console.error('File upload failed:', err)
      } finally {
        setUploading(false)
      }
    }

    const linkedConsultation = patientConsultations.find(c => c.id === linkedConsultationId)

    onSubmit({
      title: finalTitle,
      category: labType === CUSTOM_VALUE ? 'Other' : categoryOf(labType),
      results,
      notes: labType === CUSTOM_VALUE ? customNotes.trim() : '',
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      linkedConsultationId,
      linkedConsultationName: linkedConsultation?.diagnosisName || '',
      documentId,
      fileUrl,
      fileName,
    })
  }

  const renderField = (field) => {
    const value = results[field.key] ?? ''
    if (field.type === 'select') {
      return (
        <div className="alm-field" key={field.key}>
          <label className="alm-label">{field.label}</label>
          <select className="alm-input alm-select" value={value}
            onChange={e => setResultField(field.key, e.target.value)}>
            <option value="">Select…</option>
            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )
    }
    if (field.type === 'textarea') {
      return (
        <div className="alm-field alm-field--full" key={field.key}>
          <label className="alm-label">{field.label}</label>
          <textarea className="alm-input alm-textarea" rows={3}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={value} onChange={e => setResultField(field.key, e.target.value)} />
        </div>
      )
    }
    return (
      <div className="alm-field" key={field.key}>
        <label className="alm-label">{field.label}{field.unit ? ` (${field.unit})` : ''}</label>
        <input className="alm-input" type={field.type === 'number' ? 'number' : 'text'}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          value={value} onChange={e => setResultField(field.key, e.target.value)} />
      </div>
    )
  }

  const gridFields = activeFields.filter(f => f.type !== 'textarea')
  const fullFields = activeFields.filter(f => f.type === 'textarea')

  return (
    <div className="alm-backdrop" onClick={onClose}>
      <div className="alm-modal" onClick={e => e.stopPropagation()}>
        <div className="alm-head">
          <h2 className="alm-title">{editingLab ? 'Edit Lab' : 'Add Lab'}</h2>
          <button className="alm-close" onClick={onClose} aria-label="Close">{ICONS.close}</button>
        </div>

        <div className="alm-field">
          <label className="alm-label">Test Type</label>
          <div className="alm-select-wrap">
            <select className="alm-input alm-select" value={labType}
              onChange={e => { setLabType(e.target.value); setResults({}) }}>
              <option value="" disabled>Select a test type</option>
              {Object.entries(LAB_CATEGORIES).map(([cat, types]) => (
                <optgroup key={cat} label={cat}>
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              ))}
              <option value={CUSTOM_VALUE}>Custom / Other…</option>
            </select>
            <span className="alm-select-chevron">{ICONS.chevronDown}</span>
          </div>

          {labType === CUSTOM_VALUE && (
            <input className="alm-input" placeholder="Enter custom test name" style={{ marginTop: 8 }}
              value={customTitle} onChange={e => setCustomTitle(e.target.value)} />
          )}
        </div>

        {/* Test-specific result fields */}
        {gridFields.length > 0 && (
          <div className="alm-fields-grid">
            {gridFields.map(renderField)}
          </div>
        )}
        {fullFields.map(renderField)}

        {labType === CUSTOM_VALUE && (
          <div className="alm-field">
            <label className="alm-label">Notes</label>
            <textarea className="alm-input alm-textarea" rows={3} placeholder="Enter result notes"
              value={customNotes} onChange={e => setCustomNotes(e.target.value)} />
          </div>
        )}

        <div className="alm-field">
          <label className="alm-label">Link patient to document</label>
          <div className="alm-select-wrap">
            <input className="alm-input" placeholder="Enter patient"
              value={patientQuery}
              onChange={e => { setPatientQuery(e.target.value); setSelectedPatient(null); setLinkedConsultationId(''); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)} />
            <span className="alm-select-chevron">{ICONS.chevronDown}</span>

            {showSuggest && suggestions.length > 0 && (
              <div className="alm-suggest-list">
                {suggestions.map(p => (
                  <button key={p.id} className="alm-suggest-item" onClick={() => pickPatient(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* A test can't exist without a consultation to justify it */}
        {selectedPatient && (
          <div className="alm-field">
            <label className="alm-label">Link to Consultation</label>
            {patientConsultations.length > 0 ? (
              <select className="alm-input alm-select" value={linkedConsultationId}
                onChange={e => setLinkedConsultationId(e.target.value)}>
                <option value="" disabled>Select a consultation</option>
                {patientConsultations.map(c => (
                  <option key={c.id} value={c.id}>{c.diagnosisName || 'Untitled'} — {c.date}</option>
                ))}
              </select>
            ) : (
              <p className="alm-hint alm-hint--error">
                {selectedPatient.firstName} has no consultation on record — add one from the Patients tab before adding a lab for them.
              </p>
            )}
          </div>
        )}

        <div
          className={`alm-dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => document.getElementById('alm-file-input').click()}
        >
          <input id="alm-file-input" type="file" hidden onChange={e => handleFile(e.target.files[0])} />
          {ICONS.upload}
          <p className="alm-dropzone-label">
            {file ? `✓ ${file.name}` : existingFileName ? `Current file: ${existingFileName}` : 'Drop file here'}
          </p>
        </div>

        <div className="alm-footer">
          <button className="alm-btn alm-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="alm-btn alm-btn--save" disabled={!canSave} onClick={handleSave}>
            {saving || uploading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}