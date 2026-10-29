import { useState } from 'react'
import { DetailHeader, RichBody, RichToolbar, PatientCard, MediaCard, ListCard, NotesCard, EditedByFooter } from './RecordDetailParts'
import './RecordDetailParts.css'

export default function AppointmentDetailView({ record, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(record.bodyHtml || `<p>${record.reasonDetail || record.reason}</p>`)
  const [documents, setDocuments] = useState(record.documents || [])
  const [medication, setMedication] = useState(record.medication || [
    { name: 'Montelukast', sub: 'Tablet, Oral, OD', value: '10mg', valueSub: '' },
    { name: 'Salbutamol', sub: 'Inhaler, Inhaled, PRN', value: '100mcg', valueSub: '' },
  ])
  const [allergies, setAllergies] = useState(record.allergiesDetail || [
    { name: 'Penicillin', sub: 'Drug', value: 'Hives, Swelling', valueSub: 'Severe' },
  ])
  const [notes, setNotes] = useState(record.clinicalNotes ||
    'X-Ray clear. Symptoms likely asthma-related. Review current inhaler usage and technique. Consider referral to pulmonologist if no improvement after medication adjustment.')

  const toggleEdit = () => {
    if (editing) onSave?.({ ...record, bodyHtml: body, documents, medication, allergiesDetail: allergies, clinicalNotes: notes })
    setEditing(e => !e)
  }

  const handleDelete = () => {
    if (window.confirm('Delete this appointment? This cannot be undone.')) onDelete?.(record)
  }

  return (
    <div className="rd-detail-grid with-rail-left">
      <RichToolbar vertical editing={editing} onToggleEdit={toggleEdit} onDelete={handleDelete} />

      <div>
        <DetailHeader
          title={record.apptTitle || 'Follow Up'}
          subtitleLabel="Assigned Doctor,"
          subtitleName={record.doctorName || 'Dr. Zane Brooks'}
          tags={[record.priority || 'Routine', `C${String(record.id).slice(-3)}`, record.confirmed === false ? 'Pending' : 'Confirmed']}
          topRight={<><p className="rd-kv-value"><b>{record.date}</b></p><p className="rd-kv-value"><b>{record.time}</b></p></>}
        />
        <RichBody html={body} editing={editing} onChange={setBody} />
        <EditedByFooter name={record.editedBy || 'Dr. Jessica Forbeson'} date={record.editedDate || "June 6th '26"} />
      </div>

      <div className="rd-sidebar">
        <PatientCard name={record.patientName} />
        <MediaCard title="Documents" items={documents} onRemove={(i) => setDocuments(d => d.filter((_, idx) => idx !== i))} />
        <ListCard title="Medication" items={medication} onChange={(i, row) => setMedication(m => m.map((r, idx) => idx === i ? row : r))} />
        <ListCard title="Allergies" items={allergies} onChange={(i, row) => setAllergies(a => a.map((r, idx) => idx === i ? row : r))} />
        <NotesCard text={notes} onChange={setNotes} />
      </div>
    </div>
  )
}