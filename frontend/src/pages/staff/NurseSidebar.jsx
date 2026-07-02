// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseSidebar.jsx
// CSS  : src/pages/staff/NurseSidebar.css
//
// Three stacked sections:
//   1. Patients list (blue)   — flexes to fill remaining space
//   2. Patient detail (dark)  — only renders when a patient
//                                is selected; paginated stats
//   3. Nav (black)            — fixed, route-aware highlighting
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { patientService } from '../../services'
import './NurseSidebar.css'

import send from '../../assets/black/send.png';
import blood from '../../assets/black/blood.png';
import ruler from '../../assets/black/ruler.png';
import measure from '../../assets/black/measure.png';
import pulse from '../../assets/black/pulse.png';
import temperature from '../../assets/black/temperature.png';
import lungs from '../../assets/black/lungs.png';
import pressure from '../../assets/black/pressure.png';
import oxygen from '../../assets/black/oxygen.png';
import pain from '../../assets/black/pain.png';

import edit from '../../assets/inverted/edit.png';
import body from '../../assets/inverted/body.png';
import add from '../../assets/inverted/plus.png';
import close from '../../assets/inverted/close.png';
import settings from '../../assets/inverted/settings.png';
import logout from '../../assets/inverted/logout.png';

import image1 from '../../assets/images/image1.jpeg';

const NAV_ITEMS = [
  { key: 'overview',     label: 'Overview',     path: '/staff/overview',     icon: 'home'  },
  { key: 'appointments', label: 'Appointments', path: '/staff/appointments', icon: 'clock' },
  { key: 'notes',        label: 'Notes',         path: '/staff/notes',        icon: 'note'  },
  { key: 'documents',    label: 'Documents',     path: '/staff/documents',   icon: 'folder'},
  { key: 'imaging',      label: 'Imaging',       path: '/staff/imaging',     icon: 'brain' },
  { key: 'labs',         label: 'Labs',          path: '/staff/labs',        icon: 'flask' },
]

const ICONS = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  note: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h13l3 3v13a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  brain: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 3a3 3 0 00-3 3v1a3 3 0 00-2 5 3 3 0 002 5v1a3 3 0 006 0V6a3 3 0 00-3-3zM15 3a3 3 0 013 3v1a3 3 0 012 5 3 3 0 01-2 5v1a3 3 0 01-6 0V6a3 3 0 013-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  flask: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H4a2 2 0 110-4h.1a1.7 1.7 0 001.6-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5V4a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1H20a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  send: <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  pencil: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  drop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2c4 5 7 8.5 7 12a7 7 0 11-14 0c0-3.5 3-7 7-12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  ruler: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M7 8v3M11 8v3M15 8v3" stroke="currentColor" strokeWidth="1.6"/></svg>,
  bmi: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M9 9h6M9 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  thermo: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10 13.5V4a2 2 0 114 0v9.5a4 4 0 11-4 0z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  lungs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3v8M8 11c-3 0-4 2-4 5s1 4 3 4 2-2 2-4v-5zM16 11c3 0 4 2 4 5s-1 4-3 4-2-2-2-4v-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-9.5-9C.8 8.4 2 5 5.5 5c2 0 3.5 1.2 4.5 2.8C11 6.2 12.5 5 14.5 5 18 5 19.2 8.4 21.5 12c-2.5 4.5-9.5 9-9.5 9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  bp: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="6" stroke="currentColor" strokeWidth="1.6"/><path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M9 2h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  pain: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M9 9h.01M15 9h.01M8 16s1.5-2 4-2 4 2 4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  oxygen: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2a5 5 0 015 5c0 3-5 9-5 9s-5-6-5-9a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
}

const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()
const AV_COLORS = ['#2D9C9C', '#1F4788', '#8B5CF6', '#F59E0B', '#6B7280']

// ── Mock fallback data (swap for real patientService results) ──
const MOCK_PATIENTS = [
  {
    id: 'p1', firstName: 'H', lastName: 'Evans', gender: 'Male', age: 25, online: true,
    image: image1,
    diagnosis: { name: 'Atherosclerosis', severity: 'Chronic' },
    blood: 'AB+', heightWeight: "5'5 ft, 160 lbs", bmi: '22.4',
    vitals: { temp: '98.6°F', respRate: '16/min', heartRate: '72 bpm', bp: '120/80', painRating: '3/10', o2sat: '98%' },
  },
  { id: 'p2', firstName: 'M', lastName: 'Vincent', gender: 'Female', age: 24, online: true,
    image: image1,
    diagnosis: { name: 'Hypertension', severity: 'Chronic' },
    blood: 'O+', heightWeight: "5'6 ft, 140 lbs", bmi: '21.8',
    vitals: { temp: '98.4°F', respRate: '14/min', heartRate: '78 bpm', bp: '138/90', painRating: '1/10', o2sat: '99%' },
  },
]

export default function NurseSidebar({ onSelectPatient, selectedPatient: externalSelected }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [patients, setPatients]   = useState(MOCK_PATIENTS)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(MOCK_PATIENTS[0])
  const [page, setPage]           = useState(0)
  const [showAdd, setShowAdd]     = useState(false)
  const [allPatients, setAllPatients] = useState([])

  useEffect(() => { loadAllPatients() }, [])

  const loadAllPatients = async () => {
    try {
      const res = await patientService.getPatients()
      if (res.success) setAllPatients(res.patients)
    } catch (e) { /* fall back to mock silently */ }
  }

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const selectPatient = (p) => {
    setSelected(p)
    setPage(0)
    onSelectPatient?.(p)
  }

  const removeFromList = (id, e) => {
    e.stopPropagation()
    setPatients(p => p.filter(x => x.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const closeDetail = () => setSelected(null)

  const addPatientToList = (p) => {
    if (!patients.find(x => x.id === p.id)) {
      setPatients(prev => [...prev, {
        id: p.id, firstName: p.firstName, lastName: p.lastName,
        gender: p.gender || 'Male', age: 0, online: false,
        diagnosis: { name: p.diagnosis || 'No diagnosis on file', severity: null },
        blood: p.bloodType || '—', heightWeight: '—', bmi: '—',
        vitals: {},
      }])
    }
    setShowAdd(false)
  }

  const activeKey = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.key || 'overview'

  return (
    <div className="ns-shell">

      {/* ── 1. Patients list ─────────────────────────── */}
      <div className="ns-patients">
        <div className="ns-search-row">
          <div className="ns-search">
            <input className="ns-search-input" placeholder="Search"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <button className="ns-add-btn" onClick={() => setShowAdd(s => !s)} aria-label="Add patient">
            <img src={add} className="ns-icon"/>
          </button>
        </div>

        {showAdd && (
          <div className="ns-add-panel">
            <p className="ns-add-title">Add a patient to view</p>
            <div className="ns-add-list">
              {allPatients.slice(0, 6).map(p => (
                <button key={p.id} className="ns-add-item" onClick={() => addPatientToList(p)}>
                  {p.firstName} {p.lastName}
                </button>
              ))}
              {allPatients.length === 0 && <p className="ns-add-empty">No other patients found</p>}
            </div>
          </div>
        )}

        <div className="ns-patient-list">
          {filtered.map((p, i) => (
            <div key={p.id}
              className={`ns-patient-item${selected?.id === p.id ? ' active' : ''}`}
              onClick={() => selectPatient(p)}>
              <div className="ns-patient-av-wrap">
                <div className="ns-patient-av">
                  <img
                    src={p.image}
                    className="ns-full-icon"
                    alt={`${p.firstName} ${p.lastName}`}
                    onClick={(e) => { e.stopPropagation(); selectPatient(p) }}
                  />

                  {/* {getInitials(p.firstName, p.lastName)} */}
                </div>

                {p.online && <span className="ns-online-dot" />}
              </div>

              <div className="ns-patient-info">
                <span className="ns-patient-name">{p.firstName}. {p.lastName}</span>
                <span className="ns-patient-meta">{p.gender}{p.age ? `, ${p.age}` : ''}</span>
              </div>
              
              <button className="ns-patient-remove" onClick={e => removeFromList(p.id, e)} aria-label="Remove">
                <img src={close} className="ns-icon"/>
              </button>
            </div>
          ))}
        </div>

        <div className="ns-patient-count-wrap">
          <p className="ns-patient-count">{filtered.length} patients</p>
        </div>
      </div>

      {/* ── 2. Selected patient detail (paginated) ───── */}
      {selected && (
        <div className="ns-detail">
          <div className="ns-detail-head">
            <div className="ns-detail-av-wrap">
              <div className="ns-detail-av">{getInitials(selected.firstName, selected.lastName)}</div>
              {selected.online && <span className="ns-online-dot ns-online-dot--detail" />}
            </div>
           
            <div className="ns-detail-info">
              <p className="ns-detail-name">{selected.firstName}. {selected.lastName}</p>
              <p className="ns-detail-meta">{selected.gender} {selected.age}</p>
            </div>

            <div className="ns-detail-btns">
              <button className="ns-detail-send"
                onClick={() => navigate('/staff/messaging')} aria-label="Message patient">
                <img src={send} className="ns-icon"/>
              </button>

              <div className="ns-detail-icon-btns">
                <button className="ns-detail-icon-btn"
                  onClick={() => navigate(`/staff/patients/${selected.id}/edit`)} aria-label="Edit patient">
                    <img src={edit} className="ns-sml-icon"/>
                </button>
                
                <button className="ns-detail-icon-btn" onClick={closeDetail} aria-label="Close">
                  <img src={close} className="ns-sml-icon"/>
                </button>
              </div>
            </div>
          </div>

          {/* Page 0: diagnosis + core stats */}
          {page === 0 && (
            <div className="ns-detail-page">
              <div className="ns-diagnosis-row">
                <div className="ns-wrap-icon">
                  <img src={body} className="ns-sub-icon"/>
                </div>

                <div className="ns-diagnosis-text">
                  <p className="ns-diagnosis-name">{selected.diagnosis?.name || 'No diagnosis'}</p>
                  <p className="ns-diagnosis-sub">Diagnosis</p>
                </div>
                {selected.diagnosis?.severity && (
                  <span className="ns-severity-badge">{selected.diagnosis.severity}</span>
                )}
              </div>

              <div className="ns-stat-row">
                <div className="ns-stat-box">
                  <img src={blood} className="ns-mid-icon"/>
                  <p className="ns-stat-label">Blood</p>
                  <p className="ns-stat-value">{selected.blood}</p>
                </div>
                <div className="ns-stat-box">
                  <img src={ruler} className="ns-mid-icon"/>
                  <p className="ns-stat-label">Hei/Weight</p>
                  <p className="ns-stat-value ns-stat-value--sm">{selected.heightWeight}</p>
                </div>
                <div className="ns-stat-box">
                  <img src={measure} className="ns-mid-icon"/>
                  <p className="ns-stat-label">BMI</p>
                  <p className="ns-stat-value">{selected.bmi}</p>
                </div>
              </div>
            </div>
          )}

          {/* Page 1: temp / resp rate / heart rate */}
          {page === 1 && (
            <div className="ns-detail-page">
              <div className="ns-diagnosis-row">
                <div className="ns-wrap-icon">
                  <img src={body} className="ns-sub-icon"/>
                </div>

                <div className="ns-diagnosis-text">
                  <p className="ns-diagnosis-name">{selected.diagnosis?.name || 'No diagnosis'}</p>
                  <p className="ns-diagnosis-sub">Diagnosis</p>
                </div>
                {selected.diagnosis?.severity && (
                  <span className="ns-severity-badge">{selected.diagnosis.severity}</span>
                )}
              </div>

              <div className="ns-stat-row">
                <div className="ns-stat-box">
                  <img src={temperature} className="ns-mid-icon"/>
                  <p className="ns-stat-label">Temp</p>
                  <p className="ns-stat-value ns-stat-value--sm">{selected.vitals?.temp || '—'}</p>
                </div>
                <div className="ns-stat-box">
                  <img src={lungs} className="ns-mid-icon"/>
                  <p className="ns-stat-label">Resp. Rate</p>
                  <p className="ns-stat-value ns-stat-value--sm">{selected.vitals?.respRate || '—'}</p>
                </div>
                <div className="ns-stat-box">
                  <img src={pulse} className="ns-mid-icon"/>
                  <p className="ns-stat-label">Heart Rate</p>
                  <p className="ns-stat-value ns-stat-value--sm">{selected.vitals?.heartRate || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Page 2: BP / pain rating / O2 sat */}
          {page === 2 && (
            <div className="ns-detail-page">
              <div className="ns-diagnosis-row">
                <div className="ns-wrap-icon">
                  <img src={body} className="ns-sub-icon"/>
                </div>

                <div className="ns-diagnosis-text">
                  <p className="ns-diagnosis-name">{selected.diagnosis?.name || 'No diagnosis'}</p>
                  <p className="ns-diagnosis-sub">Diagnosis</p>
                </div>
                {selected.diagnosis?.severity && (
                  <span className="ns-severity-badge">{selected.diagnosis.severity}</span>
                )}
              </div>

              <div className="ns-stat-row">
                <div className="ns-stat-box">
                  <img src={pressure} className="ns-mid-icon"/>
                  <p className="ns-stat-label">Blood Pressure</p>
                  <p className="ns-stat-value ns-stat-value--sm">{selected.vitals?.bp || '—'}</p>
                </div>
                <div className="ns-stat-box">
                  <img src={pain} className="ns-mid-icon"/>
                  <p className="ns-stat-label">Pain Rating</p>
                  <p className="ns-stat-value ns-stat-value--sm">{selected.vitals?.painRating || '—'}</p>
                </div>
                <div className="ns-stat-box">
                  <img src={oxygen} className="ns-mid-icon"/>
                  <p className="ns-stat-label">O₂ Saturation</p>
                  <p className="ns-stat-value ns-stat-value--sm">{selected.vitals?.o2sat || '—'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="ns-pagination">
            {[0, 1, 2].map(i => (
              <button key={i}
                className={`ns-page-dot${page === i ? ' active' : ''}`}
                onClick={() => setPage(i)} aria-label={`Page ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Nav ────────────────────────────────────── */}
      <div className="ns-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.key}
            className={`ns-nav-item${activeKey === item.key ? ' active' : ''}`}
            onClick={() => navigate(item.path)}>
            <div className={`ns-nav-icon${activeKey === item.key ? ' active' : ''}`}>
              {ICONS[item.icon]}
              </div>
            <span className="ns-nav-label">{item.label}</span>
          </button>
        ))}

        <div className="ns-nav-spacer" />

        <div className="ns-nav-footer">
          <button className="ns-icon-btn" onClick={() => navigate('/staff/settings')} aria-label="Settings">
            <img src={settings} className="ns-alt-icon"/>
          </button>

          <button className="ns-icon-btn" onClick={() => navigate('/login')} aria-label="Log out">
            <img src={logout} className="ns-other-icon"/>
          </button>
        </div>
      </div>
    </div>
  )
}