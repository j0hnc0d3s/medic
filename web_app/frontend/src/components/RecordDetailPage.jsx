// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/records/RecordDetailPage.jsx
// CSS  : src/pages/staff/RecordsShared.css (shared)
// ─────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
import NurseSidebar from '@/pages/staff/NurseSidebar'
import { PencilIcon, TrashIcon, ImagePlaceholderIcon } from './RecordIcons'
import {
  MOCK_PATIENT, MOCK_APPOINTMENT_DETAIL, MOCK_NOTE_DETAIL,
  MOCK_IMAGING_DETAIL, MOCK_LAB_DETAIL,
} from './mockData'
import './RecordsShared.css'

export default function RecordDetailPage({ type }) {
  const navigate = useNavigate()
  const patient   = MOCK_PATIENT

  const data =
    type === 'appointments' ? MOCK_APPOINTMENT_DETAIL :
    type === 'notes'        ? MOCK_NOTE_DETAIL :
    type === 'imaging'      ? MOCK_IMAGING_DETAIL :
    type === 'labs'         ? MOCK_LAB_DETAIL : null

  if (!data) return null

  return (
    <div className="rd-shell">
      <NurseSidebar />

      <div className="rd-main">
        <div className="rd-content">

          <h1 className="rd-title">{data.title}</h1>

          <div className="rd-meta-row">
            {data.assignedDoctor && (
              <p className="rd-meta-text">Assigned Doctor <b>{data.assignedDoctor}</b></p>
            )}
            {data.orderedBy && (
              <p className="rd-meta-text">Ordered by <b>{data.orderedBy}</b></p>
            )}
            {data.createdBy && (
              <p className="rd-meta-text">Created by <b>{data.createdBy}</b> on <b>{data.createdOn}</b></p>
            )}
            {(data.date || data.time) && (
              <span style={{ marginLeft: 'auto', fontSize: 13, color: '#b8bcc2' }}>
                {data.date} {data.time && <><br/>{data.time}</>}
              </span>
            )}
          </div>

          {data.tags && (
            <div className="rd-tags">
              {data.tags.map(t => <span key={t} className="rd-tag">{t}</span>)}
            </div>
          )}

          <div className="rd-toolbar">
            <button className="rd-toolbar-btn">B</button>
            <button className="rd-toolbar-btn"><i>I</i></button>
            <button className="rd-toolbar-btn" style={{ textDecoration: 'underline' }}>U</button>
            <button className="rd-toolbar-btn">≡</button>
            <button className="rd-toolbar-btn">⋮≡</button>
            <div className="rd-toolbar-divider" />
            <button className="rd-toolbar-btn"><PencilIcon /></button>
            <button className="rd-toolbar-btn danger"><TrashIcon /></button>
          </div>

          <div className="rd-body">
            {Array.isArray(data.body)
              ? data.body.map((p, i) => <p key={i}>{p}</p>)
              : <p>{data.body}</p>}
          </div>

          <p className="rd-footer">
            Edited by <b>{data.editedBy}</b> on {data.editedOn}
          </p>
        </div>

        {/* ── Right panel ──────────────────────────────── */}
        <div className="rd-panel">

          <div className="rd-patient-card">
            <img src={patient.avatar} className="rd-patient-av" alt="" />
            <div>
              <p className="rd-patient-name">{patient.firstName} {patient.lastName}</p>
              <div className="rd-patient-tags">
                <span className="rd-patient-tag">{patient.id}</span>
                <span className="rd-patient-tag">{patient.gender}, {patient.age}</span>
              </div>
            </div>
          </div>

          {/* Images — notes, imaging, labs */}
          {(type === 'notes' || type === 'imaging' || type === 'labs') && (
            <div className="rd-card">
              <div className="rd-card-head">
                <p className="rd-card-title">{type === 'imaging' ? 'Images' : 'Images'}</p>
                <button className="rd-card-edit"><PencilIcon /></button>
              </div>
              <div className="rd-images-row">
                <div className="rd-image-placeholder"><ImagePlaceholderIcon /></div>
                {(data.images || []).map(i => <div key={i} className="rd-image-thumb" />)}
              </div>
            </div>
          )}

          {/* Documents — appointments */}
          {type === 'appointments' && (
            <div className="rd-card">
              <div className="rd-card-head">
                <p className="rd-card-title">Documents</p>
              </div>
              <div className="rd-images-row">
                <div className="rd-image-placeholder"><ImagePlaceholderIcon /></div>
                {(data.documents || []).map(i => <div key={i} className="rd-image-thumb" />)}
              </div>
            </div>
          )}

          {/* History — imaging, labs */}
          {data.history && (
            <div className="rd-card">
              <div className="rd-card-head"><p className="rd-card-title">History</p></div>
              <div className="rd-info-row">
                <span className="rd-info-label">Date Performed</span>
                <span className="rd-info-value">{data.history.datePerformed}</span>
              </div>
              <div className="rd-info-row">
                <span className="rd-info-label">Performed by</span>
                <span className="rd-info-value">{data.history.performedBy}</span>
              </div>
              <div className="rd-info-row">
                <span className="rd-info-label">Dated Ordered</span>
                <span className="rd-info-value">{data.history.dateOrdered}</span>
              </div>
            </div>
          )}

          {/* Results — imaging (object) or labs (array) */}
          {data.results && !Array.isArray(data.results) && (
            <div className="rd-card">
              <div className="rd-card-head">
                <p className="rd-card-title">Results</p>
                <button className="rd-card-edit"><PencilIcon /></button>
              </div>
              <div className="rd-info-row">
                <span className="rd-info-label">Findings</span>
                <span className="rd-info-value danger">{data.results.findings}</span>
              </div>
              <div className="rd-info-row">
                <span className="rd-info-label">Status</span>
                <span className="rd-info-value">{data.results.status}</span>
              </div>
              <div className="rd-info-row">
                <span className="rd-info-label">Series</span>
                <span className="rd-info-value">{data.results.series}</span>
              </div>
            </div>
          )}

          {data.results && Array.isArray(data.results) && (
            <div className="rd-card">
              <div className="rd-card-head"><p className="rd-card-title">Results</p></div>
              {data.results.map(r => (
                <div key={r.label} className="rd-info-row">
                  <span className="rd-info-label">{r.label}</span>
                  <span className={`rd-info-value${r.danger ? ' danger' : ''}${r.success ? ' success' : ''}`}>
                    {r.value}
                    {r.sub && <span className="rd-info-sub">{r.sub}</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Medication — appointments */}
          {data.medication && (
            <div className="rd-card">
              <div className="rd-card-head">
                <p className="rd-card-title">Medication</p>
                <button className="rd-card-edit"><PencilIcon /></button>
              </div>
              {data.medication.map(m => (
                <div key={m.name} className="rd-med-item">
                  <span className="rd-med-name">{m.name}</span>
                  <div>
                    <span className="rd-med-dose">{m.dose}</span>
                    <span className="rd-med-dose-sub">{m.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Allergies — appointments */}
          {data.allergies && (
            <div className="rd-card">
              <div className="rd-card-head">
                <p className="rd-card-title">Allergies</p>
                <button className="rd-card-edit"><PencilIcon /></button>
              </div>
              {data.allergies.map(a => (
                <div key={a.name} className="rd-allergy-item">
                  <span className="rd-med-name">{a.name}</span>
                  <div>
                    <span className="rd-med-dose">{a.type}</span>
                    <span className="rd-med-dose-sub">{a.reaction}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes — appointments */}
          {data.notes && (
            <div className="rd-card">
              <div className="rd-card-head">
                <p className="rd-card-title">Notes</p>
                <button className="rd-card-edit"><PencilIcon /></button>
              </div>
              <p className="rd-notes-text">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
