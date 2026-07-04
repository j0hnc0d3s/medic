// ─────────────────────────────────────────────────────────
// FILE : src/components/AddDocumentModal.jsx
// CSS  : src/components/AddDocumentModal.css
//
// Create or edit a `documents` record via documentService.
// Unlike labs/imaging, this isn't gated by a consultation — a
// document (insurance card, ID, referral letter) is general
// paperwork, not an ordered test.
// ─────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react'
import documentService from '../services/documentService'
import { useAuth } from '../contexts/AuthContext'
import './AddDocumentModal.css'

const ICONS = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  upload: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M8 8l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

export default function AddDocumentModal({ patients, editingDocument, saving, onSubmit, onClose }) {
  const { userProfile } = useAuth()

  const [name, setName] = useState('')

  const [patientQuery, setPatientQuery]     = useState('')
  const [showSuggest, setShowSuggest]       = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const [file, setFile]           = useState(null)
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [existingFileName, setExistingFileName] = useState(null)

  useEffect(() => {
    if (!editingDocument) return
    setName(editingDocument.name || '')
    setPatientQuery(editingDocument.patientName || '')
    setExistingFileName(editingDocument.fileName || null)
    if (editingDocument.patientId) {
      const match = patients.find(p => p.id === editingDocument.patientId)
      if (match) setSelectedPatient(match)
    }
  }, [editingDocument, patients])

  const suggestions = useMemo(() => {
    if (!patientQuery.trim()) return []
    return patients
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientQuery.toLowerCase()))
      .slice(0, 6)
  }, [patientQuery, patients])

  const pickPatient = (p) => {
    setSelectedPatient(p)
    setPatientQuery(`${p.firstName} ${p.lastName}`)
    setShowSuggest(false)
  }

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setExistingFileName(null)
  }

  const canSave = name.trim().length > 0 && (!!file || !!editingDocument) && !saving && !uploading

  const handleSave = async () => {
    if (!canSave) return

    let url        = editingDocument?.url        || null
    let fileName    = editingDocument?.fileName    || null
    let storagePath = editingDocument?.storagePath || null

    if (file) {
      setUploading(true)
      try {
        const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
        const res = await documentService.uploadDocument(file, {
          name: name.trim(),
          category: 'General',
          uploadedBy: staffName,
          patientId: selectedPatient?.id || null,
          patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
        })
        if (res.success) {
          url = res.url
          fileName = file.name
        }
      } catch (err) {
        console.error('File upload failed:', err)
      } finally {
        setUploading(false)
      }
    }

    onSubmit({
      name: name.trim(),
      patientId: selectedPatient?.id || null,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
      url,
      fileName,
    })
  }

  return (
    <div className="adm-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-head">
          <h2 className="adm-title">{editingDocument ? 'Edit Document' : 'Add Document'}</h2>
          <div className="adm-head-actions">
            <button className="adm-check" onClick={handleSave} disabled={!canSave} aria-label="Save">
              {ICONS.check}
            </button>
            <button className="adm-close" onClick={onClose} aria-label="Close">{ICONS.close}</button>
          </div>
        </div>

        <div className="adm-field">
          <label className="adm-label">Document Name</label>
          <input className="adm-input" placeholder="Enter document name"
            value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="adm-field">
          <label className="adm-label">Link patient to document</label>
          <div className="adm-select-wrap">
            <input className="adm-input" placeholder="Enter patient name"
              value={patientQuery}
              onChange={e => { setPatientQuery(e.target.value); setSelectedPatient(null); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)} />
            <span className="adm-select-chevron">{ICONS.chevronDown}</span>

            {showSuggest && suggestions.length > 0 && (
              <div className="adm-suggest-list">
                {suggestions.map(p => (
                  <button key={p.id} className="adm-suggest-item" onClick={() => pickPatient(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className={`adm-dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => document.getElementById('adm-file-input').click()}
        >
          <input id="adm-file-input" type="file" hidden onChange={e => handleFile(e.target.files[0])} />
          {ICONS.upload}
          <p className="adm-dropzone-label">
            {file ? `✓ ${file.name}` : existingFileName ? `Current file: ${existingFileName}` : 'Drop file here'}
          </p>
        </div>

        <div className="adm-footer">
          <button className="adm-btn adm-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn--save" disabled={!canSave} onClick={handleSave}>
            {saving || uploading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
