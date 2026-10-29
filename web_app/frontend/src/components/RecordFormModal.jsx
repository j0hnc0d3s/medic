import { useState, useEffect, useRef } from 'react'
import './FormModal.css'

// NOTE: swap for your real patient list / lookup once available
const MOCK_PATIENT_NAMES = ['H. Evans', 'M. Vincent', 'B. Thompson', 'S. Lawrence', 'D. Morgan', 'E. Gregory']

export function FileDrop({ file, onFileSelected }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  return (
    <div
      className={`no-form-dropzone${dragging ? ' dragging' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files?.[0]) onFileSelected(e.dataTransfer.files[0])
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={e => e.target.files?.[0] && onFileSelected(e.target.files[0])}
      />
      <span className="no-form-dropzone-icon">⬆</span>
      <p className="no-form-dropzone-text">{file ? file.name : 'Drop file here'}</p>
    </div>
  )
}

// fields: [{ key, label, type: 'text' | 'textarea' | 'patient-select', placeholder, half }]
export default function RecordFormModal({ typeLabel, fields, mode = 'add', initial = null, onSubmit, onClose }) {
  const buildValues = () => {
    const base = {}
    fields.forEach(f => { base[f.key] = initial?.[f.key] ?? '' })
    return base
  }

  const [values, setValues] = useState(buildValues)
  const [file, setFile] = useState(initial?.file ?? null)

  useEffect(() => {
    setValues(buildValues())
    setFile(initial?.file ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const setField = (key, val) => setValues(v => ({ ...v, [key]: val }))

  const handleSave = () => {
    onSubmit?.({ ...values, file })
    onClose()
  }

  return (
    <div className="no-modal-backdrop" onClick={onClose}>
      <div className="no-modal-card" onClick={e => e.stopPropagation()}>
        <div className="no-modal-head">
          <h2 className="no-modal-title">{mode === 'edit' ? 'Edit' : 'Add'} {typeLabel}</h2>
          <button className="no-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="no-modal-body">
          <div className="no-form-row">
            {fields.map(f => (
              <div key={f.key} className={`no-form-field${f.half ? ' half' : ''}`}>
                <label className="no-form-label">{f.label}</label>

                {f.type === 'textarea' ? (
                  <textarea
                    className="no-form-input no-form-textarea"
                    placeholder={f.placeholder}
                    value={values[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  />
                ) : f.type === 'patient-select' ? (
                  <div className="no-form-select-wrap">
                    <select
                      className="no-form-input no-form-select"
                      value={values[f.key]}
                      onChange={e => setField(f.key, e.target.value)}
                    >
                      <option value="">{f.placeholder}</option>
                      {MOCK_PATIENT_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>
                ) : (
                  <input
                    className="no-form-input"
                    placeholder={f.placeholder}
                    value={values[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          <FileDrop file={file} onFileSelected={setFile} />
        </div>

        <div className="no-modal-footer">
          <button className="no-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="no-modal-btn save" onClick={handleSave}>{mode === 'edit' ? 'Save changes' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}