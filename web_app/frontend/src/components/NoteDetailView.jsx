import { useState } from 'react'
import { DetailHeader, RichBody, RichToolbar, PatientCard, MediaCard, KeyValueCard, EditedByFooter } from './RecordDetailParts'
import './RecordDetailParts.css'

export default function ImagingDetailView({ record, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(record.bodyHtml || `<p>${record.text}</p>`)
  const [images, setImages] = useState(record.scans || [])
  const [history, setHistory] = useState(record.history || [
    { label: 'Date Performed', value: record.datePerformed || '—' },
    { label: 'Performed by', value: record.performedBy || '—' },
    { label: 'Dated Ordered', value: record.dateOrdered || '—' },
  ])
  const [results, setResults] = useState(record.results || [
    { label: 'Findings', value: record.findings || '—' },
    { label: 'Status', value: record.status || '—' },
    { label: 'Series', value: record.series || '—' },
  ])

  const toggleEdit = () => {
    if (editing) onSave?.({ ...record, bodyHtml: body, text: body.replace(/<[^>]+>/g, ' ').trim(), scans: images, history, results })
    setEditing(e => !e)
  }

  const handleDelete = () => {
    if (window.confirm('Delete this imaging record? This cannot be undone.')) onDelete?.(record)
  }

  return (
    <div className="rd-detail-grid with-rail-left">
      <RichToolbar vertical editing={editing} onToggleEdit={toggleEdit} onDelete={handleDelete} />

      <div>
        <DetailHeader
          title={record.imgTitle || record.title}
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