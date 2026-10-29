// ─────────────────────────────────────────────────────────
// FILE : src/components/AddNoteModal.jsx
// CSS  : src/components/AddNoteModal.css
//
// Create or edit a `notes` record via noteService. Unlike labs/
// imaging, a note isn't an ordered test — there's no Title field
// and no mandatory consultation link. If a consultation IS linked
// (optional), the card title is auto-derived as "On {diagnosis}";
// otherwise it falls back to a generic "Note for {patient}".
// ─────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react'
import documentService from '../services/documentService'
import { useAuth } from '../contexts/AuthContext'
import './AddNoteModal.css'

const ICONS = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  upload: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M8 8l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

export default function AddNoteModal({ patients, editingNote, saving, onSubmit, onClose }) {
  const { userProfile } = useAuth()

  const [description, setDescription] = useState('')

  const [patientQuery, setPatientQuery]     = useState('')
  const [showSuggest, setShowSuggest]       = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [linkedConsultationId, setLinkedConsultationId] = useState('')

  const [files, setFiles]         = useState([])
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [existingImages, setExistingImages] = useState([])

  useEffect(() => {
    if (!editingNote) return
    setDescription(editingNote.description || '')
    setPatientQuery(editingNote.patientName || '')
    setLinkedConsultationId(editingNote.linkedConsultationId || '')
    setExistingImages(editingNote.images || [])
    if (editingNote.patientId) {
      const match = patients.find(p => p.id === editingNote.patientId)
      if (match) setSelectedPatient(match)
    }
  }, [editingNote, patients])

  const suggestions = useMemo(() => {
    if (!patientQuery.trim()) return []
    return patients
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientQuery.toLowerCase()))
      .slice(0, 6)
  }, [patientQuery, patients])

  // Optional — a note can exist without one, unlike labs/imaging.
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
    setLinkedConsultationId('')
    setShowSuggest(false)
  }

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList || [])
    if (newFiles.length) setFiles(f => [...f, ...newFiles])
  }
  const removeNewFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i))
  const removeExistingImage = (i) => setExistingImages(imgs => imgs.filter((_, idx) => idx !== i))

  const canSave = description.trim().length > 0 && !saving && !uploading

  const handleSave = async () => {
    if (!canSave) return

    let uploadedImages = []
    if (files.length > 0) {
      setUploading(true)
      try {
        const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
        for (const file of files) {
          const res = await documentService.uploadDocument(file, {
            name: `Note — ${selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Unlinked'}`,
            category: 'Note',
            uploadedBy: staffName,
          })
          if (res.success) uploadedImages.push({ documentId: res.documentId, url: res.url, name: file.name })
        }
      } catch (err) {
        console.error('Image upload failed:', err)
      } finally {
        setUploading(false)
      }
    }

    const linkedConsultation = patientConsultations.find(c => c.id === linkedConsultationId)

    // Auto-derived card title — "On {diagnosis}" if a consultation is
    // linked, else a generic fallback naming the patient (or nothing).
    const title = linkedConsultation?.diagnosisName
      ? `On ${linkedConsultation.diagnosisName}`
      : selectedPatient
        ? `Note for ${selectedPatient.firstName} ${selectedPatient.lastName}`
        : 'Note'

    onSubmit({
      title,
      description: description.trim(),
      patientId: selectedPatient?.id || null,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
      linkedConsultationId: linkedConsultationId || null,
      linkedConsultationName: linkedConsultation?.diagnosisName || '',
      images: [...existingImages, ...uploadedImages],
    })
  }

  return (
    <div className="anm-backdrop" onClick={onClose}>
      <div className="anm-modal" onClick={e => e.stopPropagation()}>
        <div className="anm-head">
          <h2 className="anm-title">{editingNote ? 'Edit Note' : 'Add Note'}</h2>
          <button className="anm-close" onClick={onClose} aria-label="Close">{ICONS.close}</button>
        </div>

        <div className="anm-field">
          <label className="anm-label">Description</label>
          <textarea className="anm-input anm-textarea" rows={4} placeholder="Enter note"
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="anm-field">
          <label className="anm-label">Link patient to document</label>
          <div className="anm-select-wrap">
            <input className="anm-input" placeholder="Enter patient name"
              value={patientQuery}
              onChange={e => { setPatientQuery(e.target.value); setSelectedPatient(null); setLinkedConsultationId(''); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)} />
            <span className="anm-select-chevron">{ICONS.chevronDown}</span>

            {showSuggest && suggestions.length > 0 && (
              <div className="anm-suggest-list">
                {suggestions.map(p => (
                  <button key={p.id} className="anm-suggest-item" onClick={() => pickPatient(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedPatient && patientConsultations.length > 0 && (
          <div className="anm-field">
            <label className="anm-label">Link to Consultation (optional)</label>
            <select className="anm-input anm-select" value={linkedConsultationId}
              onChange={e => setLinkedConsultationId(e.target.value)}>
              <option value="">None</option>
              {patientConsultations.map(c => (
                <option key={c.id} value={c.id}>{c.diagnosisName || 'Untitled'} — {c.date}</option>
              ))}
            </select>
          </div>
        )}

        {(existingImages.length > 0 || files.length > 0) && (
          <div className="anm-thumb-row">
            {existingImages.map((img, i) => (
              <div key={`existing-${i}`} className="anm-thumb">
                <img src={img.url} alt={img.name} />
                <button onClick={() => removeExistingImage(i)} aria-label="Remove">{ICONS.close}</button>
              </div>
            ))}
            {files.map((f, i) => (
              <div key={`new-${i}`} className="anm-thumb">
                <img src={URL.createObjectURL(f)} alt={f.name} />
                <button onClick={() => removeNewFile(i)} aria-label="Remove">{ICONS.close}</button>
              </div>
            ))}
          </div>
        )}

        <div
          className={`anm-dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => document.getElementById('anm-file-input').click()}
        >
          <input id="anm-file-input" type="file" multiple hidden onChange={e => handleFiles(e.target.files)} />
          {ICONS.upload}
          <p className="anm-dropzone-label">Drop file here</p>
        </div>

        <div className="anm-footer">
          <button className="anm-btn anm-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="anm-btn anm-btn--save" disabled={!canSave} onClick={handleSave}>
            {saving || uploading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
