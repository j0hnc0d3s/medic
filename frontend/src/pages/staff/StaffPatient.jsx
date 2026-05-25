// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/StaffPatient.jsx
// CSS  : src/pages/styles/Patient.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { patientService, activityService } from '../../services'
import jsPDF from 'jspdf'
import '../styles/Patient.css'
import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'


const fmtDate = ts => {
  if (!ts) return 'N/A'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const getAge = dob => {
  if (!dob) return 'N/A'
  const b = dob.toDate ? dob.toDate() : new Date(dob)
  const t = new Date()
  let age = t.getFullYear() - b.getFullYear()
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--
  return age
}

const STAFF_NAV = [
  { img: homeImg, path: '/staff/overview', title: 'Home', active: true },
  { img: phoneImg, path: '/staff/messaging', title: 'Messaging', active: false },
  { img: clockImg, path: '/staff/appointments', title: 'Appointments', active: false },
  { img: schedImg, path: '/staff/calendar', title: 'Calendar', active: false },
]

export default function StaffPatient() {
  const { patientId } = useParams()
  const navigate      = useNavigate()
  const [patient,      setPatient]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [visitNotes,   setVisitNotes]   = useState('')

  useEffect(() => { loadPatient() }, [patientId])
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape' && showModal) { setShowModal(false); setVisitNotes('') } }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [showModal])

  const loadPatient = async () => {
    try {
      const res = await patientService.getPatient(patientId)
      if (res.success) setPatient(res.patient)
      else { alert('Patient not found'); navigate('/staff/patients') }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const addVisit = async () => {
    if (!visitNotes.trim()) return alert('Please enter visit notes')
    try {
      await updateDoc(doc(db, 'patients', patientId), {
        visits   : arrayUnion({ date: Timestamp.now(), notes: visitNotes }),
        updatedAt: Timestamp.now(),
      })
      await activityService.logActivity({
        action     : 'Visit Added',
        description: `New visit recorded for ${patient.firstName} ${patient.lastName}`,
        type       : 'patient-updated',
        user       : 'Admin',
        entity     : patientId,
      })
      setVisitNotes(''); setShowModal(false); loadPatient()
    } catch (e) { console.error(e); alert('Failed to add visit') }
  }

  const generatePDF = () => {
    const pdf = new jsPDF()
    pdf.setFontSize(20); pdf.setTextColor(31,71,136)
    pdf.text('Medic Clinic', 20, 20)
    pdf.setFontSize(10); pdf.setTextColor(107,114,128)
    pdf.text('Patient Summary Report', 20, 28)
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 34)
    pdf.setFontSize(16); pdf.setTextColor(17,24,39)
    pdf.text('Patient Information', 20, 50)
    pdf.setFontSize(11); pdf.setTextColor(55,65,81)
    pdf.text(`Name: ${patient.firstName} ${patient.lastName}`, 20, 60)
    pdf.text(`DOB: ${fmtDate(patient.dateOfBirth)}`, 20, 68)
    pdf.text(`Phone: ${patient.phone||'N/A'}`, 20, 76)
    pdf.text(`Email: ${patient.email||'N/A'}`, 20, 84)
    pdf.setFontSize(16); pdf.setTextColor(17,24,39); pdf.text('Medical History', 20, 100)
    pdf.setFontSize(11); pdf.setTextColor(55,65,81)
    pdf.text(pdf.splitTextToSize(patient.medicalHistory||'None', 170), 20, 110)
    pdf.save(`${patient.lastName}_${patient.firstName}_Summary.pdf`)
  }

  if (loading) return <div className="pd-loading"><div className="pd-spinner" /></div>
  if (!patient) return <div className="pd-shell">
      {/* ── Left icon sidebar ──────────────────────── */}
      <aside className="pv-aside">
        {STAFF_NAV.map(({ img, path, title, active }) => (
          <button key={title} title={title} aria-label={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}>
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </aside>
<p className="pd-error">Patient not found</p></div>

  const initials = `${patient.firstName?.[0]||''}${patient.lastName?.[0]||''}`.toUpperCase()

  return (
    <div className="pd-shell">

      {/* ── Top bar ───────────────────────────── */}
      <div className="pd-topbar">
        <button className="pd-back-btn" onClick={() => navigate('/staff/patients')}>
          ← Back to Patients
        </button>
        <div className="pd-topbar-actions">
          <button className="pd-btn pd-btn--ghost" onClick={generatePDF}>
            📄 Generate PDF
          </button>
          <button className="pd-btn pd-btn--primary"
            onClick={() => navigate(`/staff/patients/${patientId}/edit`)}>
            Edit Patient
          </button>
        </div>
      </div>

      {/* ── Patient header card ───────────────── */}
      <div className="pd-card">
        <div className="pd-patient-head">
          <div className="pd-av-lg">{initials}</div>
          <div>
            <h1 className="pd-patient-name">{patient.firstName} {patient.lastName}</h1>
            <p className="pd-patient-meta">
              {getAge(patient.dateOfBirth)} years old · Born {fmtDate(patient.dateOfBirth)}
            </p>
          </div>
        </div>

        <div className="pd-info-grid">
          {[
            { label: 'Phone',      value: patient.phone || 'N/A'   },
            { label: 'Email',      value: patient.email || 'N/A'   },
            { label: 'Address',    value: patient.address || 'N/A' },
            { label: 'Last Visit', value: patient.visits?.length
                ? fmtDate(patient.visits[patient.visits.length - 1].date)
                : 'No visits yet' },
          ].map(({ label, value }) => (
            <div key={label} className="pd-info-item">
              <span className="pd-info-label">{label}</span>
              <span className="pd-info-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Medical history ───────────────────── */}
      <div className="pd-card">
        <h3 className="pd-card-title">Medical History</h3>
        <p className="pd-body-text">{patient.medicalHistory || 'No medical history recorded'}</p>
      </div>

      {/* ── Notes ────────────────────────────── */}
      {patient.notes && (
        <div className="pd-card">
          <h3 className="pd-card-title">Notes</h3>
          <p className="pd-body-text">{patient.notes}</p>
        </div>
      )}

      {/* ── Visit history ────────────────────── */}
      <div className="pd-card">
        <div className="pd-card-head">
          <h3 className="pd-card-title">Visit History</h3>
          <button className="pd-btn pd-btn--primary pd-btn--sm"
            onClick={() => setShowModal(true)}>
            + Add Visit
          </button>
        </div>

        {patient.visits?.length > 0 ? (
          <div className="pd-visit-list">
            {[...patient.visits].reverse().map((v, i) => (
              <div key={i} className="pd-visit-item">
                <div className="pd-visit-head">
                  <span className="pd-visit-title">Visit {patient.visits.length - i}</span>
                  <span className="pd-visit-date">{fmtDate(v.date)}</span>
                </div>
                <p className="pd-visit-notes">{v.notes}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="pd-empty-hint">No visits recorded yet</p>
        )}
      </div>

      {/* ── Add Visit Modal ───────────────────── */}
      {showModal && (
        <div className="pd-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal-head">
              <h2 className="pd-modal-title">Add New Visit</h2>
              <button className="pd-modal-close"
                onClick={() => { setShowModal(false); setVisitNotes('') }}>×</button>
            </div>

            <div className="pd-modal-body">
              <label className="pd-modal-label">Visit Notes</label>
              <textarea
                className="pd-modal-textarea"
                placeholder="Enter visit notes, diagnosis, treatment plan…"
                value={visitNotes}
                onChange={e => setVisitNotes(e.target.value)}
                rows={8}
                autoFocus
              />
              <p className="pd-modal-date">
                📅 Visit Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="pd-modal-foot">
              <button className="pd-btn pd-btn--ghost"
                onClick={() => { setVisitNotes(''); setShowModal(false) }}>Cancel</button>
              <button className="pd-btn pd-btn--primary"
                onClick={addVisit} disabled={!visitNotes.trim()}>Save Visit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
