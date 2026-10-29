// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/records/AddRecordModal.jsx
// ─────────────────────────────────────────────────────────
import { useState, useRef } from 'react'
import { ChevronDown, UploadIcon } from './RecordIcons'

function FileDropZone({ onFile }) {
  const ref  = useRef()
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)

  const handle = f => { setFile(f); onFile?.(f) }

  return (
    <div
      className={`rec-dropzone${drag ? ' drag' : ''}${file ? ' has-file' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      onClick={() => ref.current.click()}>
      <input ref={ref} type="file" hidden onChange={e => handle(e.target.files[0])} />
      <span className="rec-dropzone-icon"><UploadIcon /></span>
      {file
        ? <span className="rec-dropzone-name">✓ {file.name}</span>
        : <span className="rec-dropzone-label">Drop file here</span>}
    </div>
  )
}

export function AddRecordModal({ type, onClose }) {
  const [form, setForm] = useState({})
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    console.log(`Save ${type}:`, form)
    onClose()
  }

  return (
    <div className="rec-modal-overlay" onClick={onClose}>
      <div className="rec-modal" onClick={e => e.stopPropagation()}>

        {/* ── Appointments ───────────────────────────── */}
        {type === 'appointments' && (
          <>
            <div className="rec-modal-head">
              <h2 className="rec-modal-title">Add Appointments</h2>
              <button className="rec-modal-close" onClick={onClose}>×</button>
            </div>

            <div className="rec-field">
              <label className="rec-label">Patient name</label>
              <div className="rec-select-wrap">
                <select className="rec-select" onChange={e => set('patient', e.target.value)}>
                  <option value="">Enter patient name</option>
                </select>
                <span className="rec-select-arrow"><ChevronDown /></span>
              </div>
            </div>

            <div className="rec-field">
              <label className="rec-label">Doctor name</label>
              <div className="rec-select-wrap">
                <select className="rec-select" onChange={e => set('doctor', e.target.value)}>
                  <option value="">Enter doctor name</option>
                </select>
                <span className="rec-select-arrow"><ChevronDown /></span>
              </div>
            </div>

            <div className="rec-field-row">
              <div className="rec-field">
                <label className="rec-label">Date</label>
                <input className="rec-input" placeholder="MM/DD/YYYY"
                  onChange={e => set('date', e.target.value)} />
              </div>
              <div className="rec-field">
                <label className="rec-label">Time</label>
                <div className="rec-select-wrap">
                  <select className="rec-select" onChange={e => set('time', e.target.value)}>
                    <option value="">HH:MM</option>
                  </select>
                  <span className="rec-select-arrow"><ChevronDown /></span>
                </div>
              </div>
            </div>

            <div className="rec-field">
              <label className="rec-label">Appointment Type</label>
              <div className="rec-select-wrap">
                <select className="rec-select" onChange={e => set('apptType', e.target.value)}>
                  <option value="">General</option>
                  <option>Follow-up</option>
                  <option>Referral</option>
                </select>
                <span className="rec-select-arrow"><ChevronDown /></span>
              </div>
            </div>

            <div className="rec-field">
              <label className="rec-label">Specialist Notes</label>
              <textarea className="rec-textarea" rows={2} placeholder="Enter notes"
                onChange={e => set('notes', e.target.value)} />
            </div>

            <div className="rec-modal-foot">
              <button className="rec-btn-cancel" onClick={onClose}>Cancel</button>
              <button className="rec-btn-save" onClick={handleSave}>Save</button>
            </div>
          </>
        )}

        {/* ── Notes ──────────────────────────────────── */}
        {type === 'notes' && (
          <>
            <div className="rec-modal-head">
              <h2 className="rec-modal-title">Add Note</h2>
              <button className="rec-modal-close" onClick={onClose}>×</button>
            </div>

            <div className="rec-field">
              <label className="rec-label">Description</label>
              <input className="rec-input" placeholder="Enter note"
                onChange={e => set('description', e.target.value)} />
            </div>

            <div className="rec-field">
              <label className="rec-label">Link patient to document</label>
              <div className="rec-select-wrap">
                <select className="rec-select" onChange={e => set('patient', e.target.value)}>
                  <option value="">Enter patient name</option>
                </select>
                <span className="rec-select-arrow"><ChevronDown /></span>
              </div>
            </div>

            <FileDropZone onFile={f => set('file', f)} />
          </>
        )}

        {/* ── Documents ──────────────────────────────── */}
        {type === 'documents' && (
          <>
            <div className="rec-modal-head">
              <h2 className="rec-modal-title">Add Document</h2>
              <button className="rec-modal-close" onClick={onClose}>×</button>
            </div>

            <div className="rec-field">
              <label className="rec-label">Document Name</label>
              <input className="rec-input" placeholder="Enter document name"
                onChange={e => set('name', e.target.value)} />
            </div>

            <div className="rec-field">
              <label className="rec-label">Link patient to document</label>
              <div className="rec-select-wrap">
                <select className="rec-select" onChange={e => set('patient', e.target.value)}>
                  <option value="">Enter patient name</option>
                </select>
                <span className="rec-select-arrow"><ChevronDown /></span>
              </div>
            </div>

            <FileDropZone onFile={f => set('file', f)} />
          </>
        )}

        {/* ── Imaging ────────────────────────────────── */}
        {type === 'imaging' && (
          <>
            <div className="rec-modal-head">
              <h2 className="rec-modal-title">Add Imaging</h2>
              <button className="rec-modal-close" onClick={onClose}>×</button>
            </div>

            <div className="rec-field">
              <label className="rec-label">Title</label>
              <input className="rec-input" placeholder="Enter title"
                onChange={e => set('title', e.target.value)} />
            </div>

            <div className="rec-field">
              <label className="rec-label">Description</label>
              <input className="rec-input" placeholder="Enter description"
                onChange={e => set('description', e.target.value)} />
            </div>

            <div className="rec-field">
              <label className="rec-label">Link patient to document</label>
              <div className="rec-select-wrap">
                <select className="rec-select" onChange={e => set('patient', e.target.value)}>
                  <option value="">Enter patient</option>
                </select>
                <span className="rec-select-arrow"><ChevronDown /></span>
              </div>
            </div>

            <FileDropZone onFile={f => set('file', f)} />
          </>
        )}

        {/* ── Labs ───────────────────────────────────── */}
        {type === 'labs' && (
          <>
            <div className="rec-modal-head">
              <h2 className="rec-modal-title">Add Lab</h2>
              <button className="rec-modal-close" onClick={onClose}>×</button>
            </div>

            <div className="rec-field">
              <label className="rec-label">Title</label>
              <input className="rec-input" placeholder="Enter title"
                onChange={e => set('title', e.target.value)} />
            </div>

            <div className="rec-field-row">
              <div className="rec-field">
                <label className="rec-label">Description</label>
                <input className="rec-input" placeholder="Enter description"
                  onChange={e => set('description1', e.target.value)} />
              </div>
              <div className="rec-field">
                <label className="rec-label">Description</label>
                <input className="rec-input" placeholder="Enter description"
                  onChange={e => set('description2', e.target.value)} />
              </div>
            </div>

            <div className="rec-field">
              <label className="rec-label">Link patient to document</label>
              <div className="rec-select-wrap">
                <select className="rec-select" onChange={e => set('patient', e.target.value)}>
                  <option value="">Enter patient</option>
                </select>
                <span className="rec-select-arrow"><ChevronDown /></span>
              </div>
            </div>

            <FileDropZone onFile={f => set('file', f)} />
          </>
        )}
      </div>
    </div>
  )
}
