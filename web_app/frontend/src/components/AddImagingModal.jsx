// ─────────────────────────────────────────────────────────
// FILE : src/components/AddImagingModal.jsx
// CSS  : src/components/AddImagingModal.css
//
// Create or edit an `imaging` record via imagingService.
// Same consultation-required rule as AddLabModal — a scan doesn't
// exist without a consultation ordering it. Supports multiple
// image attachments (X-rays/scans typically come as a set), each
// uploaded through documentService like everywhere else.
// ─────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react'
import documentService from '../services/documentService'
import { useAuth } from '../contexts/AuthContext'
import './AddImagingModal.css'

const ICONS = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  upload: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M8 8l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

export default function AddImagingModal({ patients, editingImaging, saving, onSubmit, onClose }) {
  const { userProfile } = useAuth()

  const [title, setTitle]             = useState('')
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
    if (!editingImaging) return
    setTitle(editingImaging.title || '')
    setDescription(editingImaging.description || '')
    setPatientQuery(editingImaging.patientName || '')
    setLinkedConsultationId(editingImaging.linkedConsultationId || '')
    setExistingImages(editingImaging.images || [])
    if (editingImaging.patientId) {
      const match = patients.find(p => p.id === editingImaging.patientId)
      if (match) setSelectedPatient(match)
    }
  }, [editingImaging, patients])

  const suggestions = useMemo(() => {
    if (!patientQuery.trim()) return []
    return patients
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientQuery.toLowerCase()))
      .slice(0, 6)
  }, [patientQuery, patients])

  // Imaging is a diagnostic test too — same rule as labs, it can't
  // exist without the consultation that ordered it.
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

  const canSave = title.trim().length > 0
    && !!selectedPatient
    && !!linkedConsultationId
    && !saving && !uploading

  const handleSave = async () => {
    if (!canSave) return

    let uploadedImages = []
    if (files.length > 0) {
      setUploading(true)
      try {
        const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
        for (const file of files) {
          const res = await documentService.uploadDocument(file, {
            name: `${title.trim()} — ${selectedPatient.firstName} ${selectedPatient.lastName}`,
            category: 'Imaging',
            uploadedBy: staffName,
          })
          if (res.success) {
            uploadedImages.push({ documentId: res.documentId, url: res.url, name: file.name })
          }
        }
      } catch (err) {
        console.error('Image upload failed:', err)
      } finally {
        setUploading(false)
      }
    }

    const linkedConsultation = patientConsultations.find(c => c.id === linkedConsultationId)

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      linkedConsultationId,
      linkedConsultationName: linkedConsultation?.diagnosisName || '',
      images: [...existingImages, ...uploadedImages],
    })
  }

  return (
    <div className="aim-backdrop" onClick={onClose}>
      <div className="aim-modal" onClick={e => e.stopPropagation()}>
        <div className="aim-head">
          <h2 className="aim-title">{editingImaging ? 'Edit Imaging' : 'Add Imaging'}</h2>
          <button className="aim-close" onClick={onClose} aria-label="Close">{ICONS.close}</button>
        </div>

        <div className="aim-field">
          <label className="aim-label">Title</label>
          <input className="aim-input" placeholder="Enter title"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="aim-field">
          <label className="aim-label">Description</label>
          <input className="aim-input" placeholder="Enter description"
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div className="aim-field">
          <label className="aim-label">Link patient to document</label>
          <div className="aim-select-wrap">
            <input className="aim-input" placeholder="Enter patient"
              value={patientQuery}
              onChange={e => { setPatientQuery(e.target.value); setSelectedPatient(null); setLinkedConsultationId(''); setShowSuggest(true) }}
              onFocus={() => setShowSuggest(true)} />
            <span className="aim-select-chevron">{ICONS.chevronDown}</span>

            {showSuggest && suggestions.length > 0 && (
              <div className="aim-suggest-list">
                {suggestions.map(p => (
                  <button key={p.id} className="aim-suggest-item" onClick={() => pickPatient(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedPatient && (
          <div className="aim-field">
            <label className="aim-label">Link to Consultation</label>
            {patientConsultations.length > 0 ? (
              <select className="aim-input aim-select" value={linkedConsultationId}
                onChange={e => setLinkedConsultationId(e.target.value)}>
                <option value="" disabled>Select a consultation</option>
                {patientConsultations.map(c => (
                  <option key={c.id} value={c.id}>{c.diagnosisName || 'Untitled'} — {c.date}</option>
                ))}
              </select>
            ) : (
              <p className="aim-hint aim-hint--error">
                {selectedPatient.firstName} has no consultation on record — add one from the Patients tab before adding imaging for them.
              </p>
            )}
          </div>
        )}

        {(existingImages.length > 0 || files.length > 0) && (
          <div className="aim-thumb-row">
            {existingImages.map((img, i) => (
              <div key={`existing-${i}`} className="aim-thumb">
                <img src={img.url} alt={img.name} />
                <button onClick={() => removeExistingImage(i)} aria-label="Remove">{ICONS.close}</button>
              </div>
            ))}
            {files.map((f, i) => (
              <div key={`new-${i}`} className="aim-thumb">
                <img src={URL.createObjectURL(f)} alt={f.name} />
                <button onClick={() => removeNewFile(i)} aria-label="Remove">{ICONS.close}</button>
              </div>
            ))}
          </div>
        )}

        <div
          className={`aim-dropzone${dragging ? ' dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => document.getElementById('aim-file-input').click()}
        >
          <input id="aim-file-input" type="file" accept="image/*" multiple hidden
            onChange={e => handleFiles(e.target.files)} />
          {ICONS.upload}
          <p className="aim-dropzone-label">Drop images here — multiple allowed</p>
        </div>

        <div className="aim-footer">
          <button className="aim-btn aim-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="aim-btn aim-btn--save" disabled={!canSave} onClick={handleSave}>
            {saving || uploading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
