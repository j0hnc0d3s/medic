// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientDocuments.jsx
// CSS  : src/pages/patient/PatientDocuments.css
//
// A unified feed of everything the patient can see about their own
// records: uploaded documents, lab results (only once status is
// 'completed' — a 'requested' lab isn't a result yet, so it's
// deliberately excluded here, not just hidden by a filter), and
// imaging (no separate lifecycle there, so any imaging record tied
// to them shows — the images being uploaded at all is what "becomes
// available" means for that one).
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { documentService, labService, imagingService } from '../../services'
import PatientSidebar from './PatientSidebar'
import './PatientDocuments.css'

const ICONS = {
  file: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.4"/><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.4"/></svg>,
  flask: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  brain: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3a3 3 0 00-3 3v1a3 3 0 00-2 5 3 3 0 002 5v1a3 3 0 006 0V6a3 3 0 00-3-3zM15 3a3 3 0 013 3v1a3 3 0 012 5 3 3 0 01-2 5v1a3 3 0 01-6 0V6a3 3 0 013-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
}

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'documents', label: 'Documents' },
  { key: 'labs',      label: 'Lab Results' },
  { key: 'imaging',   label: 'Imaging' },
]

const formatDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PatientDocuments() {
  const { userProfile } = useAuth()

  const [documents, setDocuments] = useState([])
  const [labs, setLabs] = useState([])
  const [imaging, setImaging] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    if (!userProfile?.uid) return
    const load = async () => {
      setLoading(true)
      try {
        const [docsRes, labsRes, imagingRes] = await Promise.all([
          documentService.getDocuments({ patientId: userProfile.uid }),
          labService.getLabs({ patientId: userProfile.uid }),
          imagingService.getImagingRecords({ patientId: userProfile.uid }),
        ])
        if (docsRes.success) setDocuments(docsRes.documents || [])
        // Only completed labs are real results — a 'requested' one
        // has nothing to show yet.
        if (labsRes.success) setLabs((labsRes.labs || []).filter(l => l.status === 'completed'))
        if (imagingRes.success) setImaging(imagingRes.records || [])
      } catch (err) {
        console.error('Failed to load documents:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userProfile?.uid])

  const feed = useMemo(() => {
    const items = [
      ...documents.map(d => ({ kind: 'documents', id: d.id, title: d.name, date: d.uploadedAt, data: d })),
      ...labs.map(l => ({ kind: 'labs', id: l.id, title: l.title, date: l.updatedAt || l.createdAt, data: l })),
      ...imaging.map(i => ({ kind: 'imaging', id: i.id, title: i.title, date: i.createdAt, data: i })),
    ]
    const filtered = tab === 'all' ? items : items.filter(i => i.kind === tab)
    return filtered.sort((a, b) => {
      const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0)
      const db_ = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0)
      return db_ - da
    })
  }, [documents, labs, imaging, tab])

  const renderPreview = (item) => {
    if (item.kind === 'documents') {
      const d = item.data
      if (d.type === 'image' && d.url) return <img src={d.url} className="pd-preview-img" alt="" />
      if (d.type === 'pdf' && d.url) return <iframe src={d.url} title={d.name} className="pd-preview-frame" />
      return <div className="pd-preview-fallback">{ICONS.file}<span>{d.fileName || 'File'}</span></div>
    }
    if (item.kind === 'labs') {
      const entries = Object.entries(item.data.results || {}).filter(([, v]) => v !== '' && v != null)
      return (
        <div className="pd-lab-results">
          {entries.length > 0 ? entries.slice(0, 4).map(([k, v]) => (
            <div key={k} className="pd-lab-result-row"><span>{k}</span><span>{v}</span></div>
          )) : <p className="pd-lab-notes">{item.data.notes || 'No details on file.'}</p>}
        </div>
      )
    }
    if (item.kind === 'imaging') {
      const first = item.data.images?.[0]
      return first
        ? <img src={first.url} className="pd-preview-img" alt="" />
        : <div className="pd-preview-fallback">{ICONS.brain}<span>No images attached</span></div>
    }
    return null
  }

  return (
    <div className="no-shell">
      <PatientSidebar />

      <div className="no-main">
        <h1 className="pd-title">My Records</h1>

        <div className="pd-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`pd-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</p>
        ) : feed.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 20 }}>
            Nothing here yet — results and imaging will show up as soon as they're ready.
          </p>
        ) : (
          <div className="pd-grid">
            {feed.map(item => (
              <div key={`${item.kind}-${item.id}`} className="pd-card">
                <div className="pd-card-head">
                  <span className={`pd-kind-badge pd-kind-badge--${item.kind}`}>
                    {item.kind === 'labs' ? ICONS.flask : item.kind === 'imaging' ? ICONS.brain : ICONS.folder}
                    {item.kind === 'labs' ? 'Lab Result' : item.kind === 'imaging' ? 'Imaging' : 'Document'}
                  </span>
                  <span className="pd-card-date">{formatDate(item.date)}</span>
                </div>
                <p className="pd-card-title">{item.title || 'Untitled'}</p>
                <div className="pd-card-preview">{renderPreview(item)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
