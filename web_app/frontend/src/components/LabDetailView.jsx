import { useState } from 'react'
import { DetailHeader, RichBody, RichToolbar, PatientCard, MediaCard, KeyValueCard, EditedByFooter } from './RecordDetailParts'
import './RecordDetailParts.css'

// NOTE: the Labs screenshot's body text and "Thoracic" tag look identical to
// the Imaging screenshot's — almost certainly a copy/paste slip in the
// original mockup rather than intentional lab content. Defaults below keep
// that text as a placeholder; swap for real lab summary copy when available.
export default function LabDetailView({ record, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(record.bodyHtml || `<p>${record.text}</p>`)
  const [images, setImages] = useState(record.scans || [])
  const [history, setHistory] = useState(record.history || [
    { label: 'Date Performed', value: record.datePerformed || '—' },
    { label: 'Processed by', value: record.processedBy || '—' },
    { label: 'Dated Ordered', value: record.dateOrdered || '—' },
  ])
  const [results, setResults] = useState(record.results || [
    { label: 'WBC', value: record.wbc || '—', sub: '(Normal: 4.5–11.0)' },
    { label: 'RBC', value: record.rbc || '—', sub: '(Normal: 4.5–5.5)' },
    { label: 'Hemoglobin', value: record.hemoglobin || '—', sub: '(Normal: 13.5–17.5)' },
    { label: 'Haematocrit', value: record.haematocrit || '—', sub: '(Normal: 38.3–48.6%)' },
    { label: 'Platelets', value: record.platelets || '—', sub: '(Normal: 150–400)' },
    { label: 'Status', value: record.status || '—' },
    { label: 'Patient Notified', value: record.patientNotified || '—' },
  ])

  const toggleEdit = () => {
    if (editing) onSave?.({ ...record, bodyHtml: body, text: body.replace(/<[^>]+>/g, ' ').trim(), scans: images, history, results })
    setEditing(e => !e)
  }

  const handleDelete = () => {
    if (window.confirm('Delete this lab record? This cannot be undone.')) onDelete?.(record)
  }

  return (
    <div className="rd-detail-grid with-rail-left">
      <RichToolbar vertical editing={editing} onToggleEdit={toggleEdit} onDelete={handleDelete} />

      <div>
        <DetailHeader
          title={record.labTitle || record.title}
          subtitleLabel="Ordered by"
          subtitleName={record.orderedBy || 'Dr. Zane Brooks'}
          tags={[record.bodyRegion || 'Thoracic']}
        />
        <RichBody html={body} editing={editing} onChange={setBody} />
        <EditedByFooter name={record.editedBy || 'Dr. Jessica Forbes'} date={record.editedDate || "June 6th '26"} />
      </div>

      <div className="rd-sidebar">
        <PatientCard name={record.patientName} />
        <MediaCard title="Images" items={images} onRemove={(i) => setImages(imgs => imgs.filter((_, idx) => idx !== i))} />
        <KeyValueCard title="History" rows={history} onChange={(i, row) => setHistory(h => h.map((r, idx) => idx === i ? row : r))} />
        <KeyValueCard title="Results" rows={results} onChange={(i, row) => setResults(r2 => r2.map((r, idx) => idx === i ? row : r))} />
      </div>
    </div>
  )
}