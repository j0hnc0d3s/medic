// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseOverview.jsx
// CSS  : src/pages/staff/NurseOverview.css
// ─────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { authService, patientService } from '../../services'
import appointmentService from '../../services/appointmentService'
import { useAuth } from '../../contexts/AuthContext'
import PatientSidebar from './PatientSidebar'
import './PatientOverview.css'

import close from '../../assets/inverted/close.png';
import left from '../../assets/inverted/left.png';
import right from '../../assets/inverted/right.png';
import edit from '../../assets/inverted/edit.png';
import notification from '../../assets/black/notification.png';

import navleft from '../../assets/inverted/navleft.png';
import navright from '../../assets/inverted/navright.png';

import doctor from '../../assets/images/doctor1.jpeg';
import pills from '../../assets/images/pills.png';
import pollen from '../../assets/images/pollen.png';

import add from '../../assets/black/plus.png';
import notes from '../../assets/black/notes.png';
import move from '../../assets/black/move.png';
import lightning from '../../assets/black/lightning.png';
import pencil from '../../assets/black/pencil.png';
import line from '../../assets/black/line.png';

import reverse_triangle from '../../assets/images/reverse_triangle.png';
import triangle from '../../assets/images/triangle.png';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Normalizes "Dr. Marshall White" -> "marshall white" for matching a
// prescribedBy/diagnosedBy string back to a real doctor record.
const normalizeDoctorName = (s) =>
  (s || '').replace(/^dr\.?\s*/i, '').trim().toLowerCase()

const mapAllergy = (entry, i) => {
  const a = typeof entry === 'string' ? { name: entry } : entry
  return {
    id:       a.id ?? i,
    name:     a.name || a.allergen || 'Unknown allergen',
    type:     a.type || 'Other',
    severity: a.severity || 'Unknown',
    desc:     a.reaction || a.description || a.desc || 'No reaction details on file.',
    status:   (a.status || 'active').toLowerCase(), // active | historical | intolerance
    doctor:   a.diagnosedBy || a.prescribedBy || a.doctor || null,
  }
}

const mapMedication = (entry, i) => {
  const m = typeof entry === 'string' ? { name: entry } : entry
  return {
    id:       m.id ?? i,
    name:     m.name || 'Medication',
    dose:     m.dosage || m.dose || '—',
    form:     m.form || '—',
    route:    m.route || '—',
    freq:     m.frequency || m.freq || '—',
    desc:     m.description || m.desc || 'No description on file.',
    status:   (m.status || 'active').toLowerCase(), // active | completed | discontinued
    doctor:   m.prescribedBy || m.doctor || null,
    progress: computeMedProgress(m),
  }
}

// Elapsed-course percentage when start/end dates exist on the record;
// otherwise null so the progress bar is simply skipped.
const computeMedProgress = (m) => {
  const start = m.startDate?.toDate ? m.startDate.toDate() : (m.startDate ? new Date(m.startDate) : null)
  const end   = m.endDate?.toDate   ? m.endDate.toDate()   : (m.endDate   ? new Date(m.endDate)   : null)
  if (!start || !end || end <= start) return null
  const now = new Date()
  const pct = ((now - start) / (end - start)) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

const ICONS = {
  plus:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  note:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  move:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>,
  pencil:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  visit: <span style={{ fontSize: 13 }}>📝</span>,
  flask: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  procedure: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M5 9l-3 3 3 3M19 9l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  hospitalisation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 11h6M12 8v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
}

const CARD_POS = {
  headaches:        { left: 20,  top: 140, width: 330, height: 177 },
  visit1:           { left: 610, top: 100, width: 250, height: 178 },
  visit2:           { left: 610, top: 370, width: 250, height: 76  },
  labsVisit:        { left: 610, top: 580, width: 270, height: 216 },
  hospitalisations: { left: 1080, top: 140, width: 200, height: 60  },
  procedure:        { left: 1080, top: 230, width: 200, height: 60  },
  labsStandalone:   { left: 1080, top: 320, width: 200, height: 60  },
}

const rightMid = (k) => ({ x: CARD_POS[k].left + CARD_POS[k].width, y: CARD_POS[k].top + CARD_POS[k].height / 2 })
const leftMid  = (k) => ({ x: CARD_POS[k].left, y: CARD_POS[k].top + CARD_POS[k].height / 2 })

function elbowPath(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dy) < 1) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`

  const radius = Math.min(20, Math.abs(dx) / 3, Math.abs(dy) / 2)
  const midX = from.x + dx / 2
  const dir = dy > 0 ? 1 : -1

  return `M ${from.x} ${from.y}
    L ${midX - radius} ${from.y}
    Q ${midX} ${from.y} ${midX} ${from.y + radius * dir}
    L ${midX} ${to.y - radius * dir}
    Q ${midX} ${to.y} ${midX + radius} ${to.y}
    L ${to.x} ${to.y}`
}

const DestTriangle = ({ x, y, size = 14 }) => (
  <img
    src={reverse_triangle}
    className="no-dest-triangle"
    alt=""
    style={{ left: x - size, top: y - size / 2, width: size, height: size }}
  />
)

const ConnectorNode = ({ x, y }) => (
  <div className="no-connector-node" style={{ left: x - 16, top: y - 16 }}>
    <img src={triangle} className="no-connector-triangle" alt="" />
  </div>
)

const ACTIVITY_COLORS = { visit: '#0066ff', lab: '#161c18', procedure: '#0b51f5', hospitalisation: '#152fdb' }
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Draggable wrapper hook ──────────────────────────────────
function useDraggable(initial) {
  const [pos, setPos] = useState(initial)
  const dragRef = useRef(null)

  const onPointerDown = (e) => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const origin = { ...pos }

    const onMove = (ev) => {
      setPos({
        left: origin.left + (ev.clientX - startX),
        top:  origin.top  + (ev.clientY - startY),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return [pos, onPointerDown]
}

const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()

const formatApptDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatApptTime = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function PatientOverview() {
  const [leftFilters, setLeftFilters] = useState({
    visits: true, hospitalisations: false, procedure: false, labs: false,
  })
  const [cardVisible, setCardVisible] = useState({ allergies: true, medication: true })

  const [allergyPage, setAllergyPage]   = useState(0)
  const [medicationPage, setMedicationPage] = useState(0)

  const [allergyPos, allergyDrag]     = useDraggable({ left: 60, top: 360 })
  const [medicationPos, medicationDrag] = useDraggable({ left: 610, top: 230 })

  const { userProfile } = useAuth()

  // ── Patient's appointments — single fetch feeds the canvas
  //    cards (visits/labs/procedure/hospitalisation), the
  //    timeline scrubber, and the Upcoming popup below.
  const [patientAppointments, setPatientAppointments] = useState([])
  const [apptsLoading, setApptsLoading] = useState(true)

  const [upcomingIdx, setUpcomingIdx]   = useState(0)
  const [showUpcoming, setShowUpcoming] = useState(true)

  useEffect(() => {
    if (userProfile?.uid) loadAppointments()
  }, [userProfile?.uid])

  const loadAppointments = async () => {
    setApptsLoading(true)
    try {
      const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      const [byUidRes, byNameRes] = await Promise.all([
        appointmentService.getAppointments({ patientId: userProfile.uid }),
        fullName ? appointmentService.getAppointments({ patientName: fullName }) : Promise.resolve({ appointments: [] }),
      ])

      const seen = new Set()
      const all = [...(byUidRes.appointments || []), ...(byNameRes.appointments || [])]
        .filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true })
        .filter(a => a.status !== 'cancelled')
        .sort((a, b) => {
          const da = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : new Date(a.appointmentDate)
          const db_ = b.appointmentDate?.toDate ? b.appointmentDate.toDate() : new Date(b.appointmentDate)
          return db_ - da // newest first
        })

      setPatientAppointments(all)
      setUpcomingIdx(0)
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setApptsLoading(false)
    }
  }

  const upcoming = patientAppointments
    .filter(a => {
      const when = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : new Date(a.appointmentDate)
      return when && when >= new Date()
    })
    .slice()
    .sort((a, b) => {
      const da = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : new Date(a.appointmentDate)
      const db_ = b.appointmentDate?.toDate ? b.appointmentDate.toDate() : new Date(b.appointmentDate)
      return da - db_ // soonest first
    })

  const currentUpcoming = upcoming[upcomingIdx] || null
  const upcomingLoading = apptsLoading

  // ── Allergies & medications (real data) ──────────────────
  const [allergies, setAllergies]         = useState([])
  const [medications, setMedications]     = useState([])
  const [linkedPatientRecord, setLinkedPatientRecord] = useState(null)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [doctorPhotos, setDoctorPhotos]   = useState(new Map())
  const [allergyFilter, setAllergyFilter]     = useState('current') // current | past
  const [medicationFilter, setMedicationFilter] = useState('current')

  useEffect(() => {
    if (userProfile?.uid) loadMedicalRecord()
  }, [userProfile?.uid])

  const loadMedicalRecord = async () => {
    setRecordsLoading(true)
    try {
      const doctorsRes = await authService.getUsersByRole('doctor')
      const photoMap = new Map()
      if (doctorsRes.success) {
        doctorsRes.users.forEach(d => {
          photoMap.set(normalizeDoctorName(`${d.firstName} ${d.lastName}`), d.profilePictureUrl || null)
        })
      }
      setDoctorPhotos(photoMap)

      // Resolve this patient's clinical record. It lives in the
      // `patients` collection (staff-managed), not on users/{uid} —
      // patientRecordId is the link written when the account was
      // registered (or manually linked by staff for accounts that
      // predate that link). Email is a fallback for either case not
      // having happened yet.
      let record = null
      if (userProfile.patientRecordId) {
        const snap = await getDoc(doc(db, 'patients', userProfile.patientRecordId))
        if (snap.exists()) record = { id: snap.id, ...snap.data() }
      }
      if (!record && userProfile.email) {
        const res = await patientService.getPatientByEmail(userProfile.email)
        if (res.success && res.patient) {
          record = res.patient
          if (res.ambiguous) {
            console.warn(`Multiple patient records match ${userProfile.email} — showing the first, ask staff to resolve the duplicate.`)
          }
        }
      }

      setLinkedPatientRecord(record)
      setAllergies((record?.allergies || []).map(mapAllergy))
      setMedications((record?.medications || []).map(mapMedication))
    } catch (err) {
      console.error('Failed to load medical record:', err)
    } finally {
      setRecordsLoading(false)
    }
  }

  const isCurrentStatus = (status) => status === 'active'

  const filteredAllergies = allergies.filter(a =>
    allergyFilter === 'current' ? isCurrentStatus(a.status) : !isCurrentStatus(a.status)
  )
  const filteredMedications = medications.filter(m =>
    medicationFilter === 'current' ? isCurrentStatus(m.status) : !isCurrentStatus(m.status)
  )

  const doctorPhotoFor = (name) => doctorPhotos.get(normalizeDoctorName(name)) || null

  useEffect(() => { setAllergyPage(0) }, [allergyFilter])
  useEffect(() => { setMedicationPage(0) }, [medicationFilter])

  const canvasRef = useRef(null)
  const timelineRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1100, height: 680 })
  const [isTimelineSpinning, setIsTimelineSpinning] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [])

  const onTimelinePointerDown = (e) => {
    e.preventDefault()
    const startX = e.clientX

    const onMove = (ev) => {
      // Could add visual feedback during drag here if desired
    }
    const onUp = (ev) => {
      const endX = ev.clientX
      const distance = startX - endX // positive = dragged left, negative = dragged right
      const threshold = 50

      if (Math.abs(distance) > threshold) {
        setIsTimelineSpinning(true)
        
        if (distance > 0) {
          // Dragged left - go to next year (with wraparound)
          setTimelineYear(y => y === YEARS[YEARS.length - 1] ? YEARS[0] : y + 1)
        } else {
          // Dragged right - go to previous year (with wraparound)
          setTimelineYear(y => y === YEARS[0] ? YEARS[YEARS.length - 1] : y - 1)
        }

        // Remove spinning class after animation completes
        setTimeout(() => setIsTimelineSpinning(false), 600)
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const [timelineYear, setTimelineYear] = useState(2026)

  const toggleLeftFilter = (key) => {
    if (key === 'visits') return // locked on, per spec
    setLeftFilters(f => ({ ...f, [key]: !f[key] }))
  }

  const toggleCard = (key) => setCardVisible(c => ({ ...c, [key]: !c[key] }))

  // ── Combine real appointments with Medical History rows ──
  // (added via the staff Patients tab, stored as a plain array on the
  // patients-collection record — not appointment docs) into one
  // activity pool, normalized to the same shape, sorted newest first.
  const historyAsActivity = (linkedPatientRecord?.medicalHistory || [])
    .map((h, i) => ({
      id:              `history-${i}`,
      appointmentDate: h.date ? new Date(h.date) : null,
      type:            h.type || 'Consultation',
      reason:          h.purpose || '',
      status:          'completed',
      fromHistory:      true,
    }))
    .filter(a => a.appointmentDate && !isNaN(a.appointmentDate))

  const allActivity = [...patientAppointments, ...historyAsActivity].sort((a, b) => {
    const da = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : new Date(a.appointmentDate)
    const db_ = b.appointmentDate?.toDate ? b.appointmentDate.toDate() : new Date(b.appointmentDate)
    return db_ - da // newest first
  })

  // ── Derive canvas sections from the combined activity ────
  const visitAppts = allActivity
    .filter(a => !['Lab Work', 'Procedure'].includes(a.type))
    .slice(0, 2)

  const labAppts = allActivity
    .filter(a => a.type === 'Lab Work')
    .slice(0, 1)

  const hospitalisationAppts = allActivity
    .filter(a => a.type === 'Hospitalisation' || a.type === 'Emergency')
    .slice(0, 1)

  const procedureAppts = allActivity
    .filter(a => a.type === 'Procedure')
    .slice(0, 1)

  // ── Timeline scrubber built from the combined activity ───
  const timeline = {}
  allActivity.forEach(a => {
    const d = a.appointmentDate?.toDate ? a.appointmentDate.toDate() : new Date(a.appointmentDate)
    if (!d || isNaN(d)) return
    const yr = d.getFullYear()
    const mo = d.getMonth()
    if (!timeline[yr]) timeline[yr] = {}
    if (!timeline[yr][mo]) timeline[yr][mo] = []
    const activityType = a.type === 'Lab Work'      ? 'lab'
                        : a.type === 'Procedure'      ? 'procedure'
                        : (a.type === 'Hospitalisation' || a.type === 'Emergency') ? 'hospitalisation'
                        : 'visit'
    if (!timeline[yr][mo].includes(activityType)) timeline[yr][mo].push(activityType)
  })

  const allergy    = filteredAllergies[Math.min(allergyPage, Math.max(0, filteredAllergies.length - 1))]
  const medication = filteredMedications[Math.min(medicationPage, Math.max(0, filteredMedications.length - 1))]

  const CONNECTOR_LINKS = [
    { id: 'h-v1',   from: 'headaches', to: 'visit1',           active: leftFilters.visits && visitAppts.length > 0 },
    { id: 'h-v2',   from: 'headaches', to: 'visit2',           active: leftFilters.visits && visitAppts.length > 1 },
    { id: 'v2-lv',  from: 'visit2',    to: 'labsVisit',        active: leftFilters.visits && visitAppts.length > 1 && labAppts.length > 0 },
    { id: 'v1-hos', from: 'visit1',    to: 'hospitalisations', active: leftFilters.hospitalisations && visitAppts.length > 0 && hospitalisationAppts.length > 0 },
    { id: 'v1-pro', from: 'visit1',    to: 'procedure',        active: leftFilters.procedure && visitAppts.length > 0 && procedureAppts.length > 0 },
    { id: 'lv-ls',  from: 'labsVisit', to: 'labsStandalone',   active: leftFilters.labs && labAppts.length > 0 },
  ]

  const visibleLinks = CONNECTOR_LINKS.filter(l => l.active)
  const originPoints = [...new Map(visibleLinks.map(l => [l.from, rightMid(l.from)])).entries()]
  const destPoints    = [...new Map(visibleLinks.map(l => [l.to,   leftMid(l.to)])).entries()]

  return (
    <div className="no-shell">
      <PatientSidebar />

      <div className="no-main">

        {/* ── Top filter pills ─────────────────────────── */}
        <div className="no-filters">
          <div className="no-filter-group">
            {[
              { key: 'visits', label: 'Visits' },
              { key: 'hospitalisations', label: 'Hospitalisations' },
              { key: 'procedure', label: 'Procedure' },
              { key: 'labs', label: 'Labs' },
            ].map(f => (
              <button key={f.key}
                className={`no-filter-pill${leftFilters[f.key] ? ' active' : ''}${f.key === 'visits' ? ' locked' : ''}`}
                onClick={() => toggleLeftFilter(f.key)}>
                <span className="no-filter-dot" />{f.label}
              </button>
            ))}
          </div>
          
          <div className="no-filter-group">
            {[
              { key: 'allergies', label: 'Allergies' },
              { key: 'medication', label: 'Medication' },
            ].map(f => (
              <button key={f.key}
                className={`no-filter-pill${cardVisible[f.key] ? ' active' : ''}`}
                onClick={() => toggleCard(f.key)}>
                <span className="no-filter-dot" />{f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Canvas ───────────────────────────────────── */}
        <div className="no-canvas" ref={canvasRef}>
          <div className="no-history">
            <svg className="no-connectors" viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`} preserveAspectRatio="none">
              {visibleLinks.map(l => (
                <path key={l.id} d={elbowPath(rightMid(l.from), leftMid(l.to))} className="no-line" />
              ))}
            </svg>

            {originPoints.map(([key, pos]) => (
              <ConnectorNode key={key} x={pos.x} y={pos.y} />
            ))}

            {destPoints.length > 0 && destPoints.map(([key, pos]) => (
              <DestTriangle key={key} x={pos.x} y={pos.y} />
            ))}

            {leftFilters.visits && !apptsLoading && (
              <>
                <div className="no-card no-card--blue condition" style={{ left: 20, top: 140, width: 330 }}>
                  <div className="no-card-tags">
                    <p className="no-card-tag">{visitAppts[0]?.type || 'No visits yet'}</p>
                    <img src={lightning} className="no-card-icon inverted" />
                  </div>

                  <h2 className="no-card-title">{visitAppts[0]?.reason || 'No condition on file'}</h2>

                  <div className="no-card-action condition">
                  </div>
                </div>

                {visitAppts[0] && (
                  <div className="no-card no-card--white" style={{ left: 610, top: 100, width: 250 }}>
                    <div className="no-visit-head">
                      <div className="no-visit-icon">
                        <img src={notes} className="no-action-icon inverted"/>
                      </div>

                      <div>
                        <p className="no-visit-title">Visits</p>
                        <p className="no-visit-sub">{visitAppts[0].reason || visitAppts[0].type || 'Visit'}</p>
                      </div>

                      <div className="no-visit-time">{formatApptTime(visitAppts[0].appointmentDate)}</div>
                    </div>
                    {visitAppts[0].symptoms?.length > 0 && (
                      <div className="no-visit-tags">
                        {visitAppts[0].symptoms.slice(0, 3).map((s, i) => (
                          <span key={i} className="no-visit-tag">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {visitAppts[1] && (
                  <div className="no-card no-card--white" style={{ left: 610, top: 370, width: 250 }}>
                    <div className="no-visit-head">
                      <div className="no-visit-icon">
                        <img src={notes} className="no-action-icon inverted"/>
                      </div>

                      <div>
                        <p className="no-visit-title">Visits</p>
                        <p className="no-visit-sub">{visitAppts[1].reason || visitAppts[1].type || 'Visit'}</p>
                      </div>

                      <div className="no-visit-time">{formatApptTime(visitAppts[1].appointmentDate)}</div>
                    </div>
                  </div>
                )}

                {labAppts[0] && (
                  <div className="no-card no-card--white" style={{ left: 610, top: 580, width: 270 }}>
                    <div className="no-visit-head">
                      <div className="no-visit-icon">
                        <img src={notes} className="no-action-icon inverted"/>
                      </div>

                      <div>
                        <p className="no-visit-title">Labs</p>
                        <p className="no-visit-sub">{labAppts[0].reason || 'Lab work'}</p>
                      </div>
                      
                      <div className="no-visit-time">{formatApptTime(labAppts[0].appointmentDate)}</div>
                    </div>
                    
                    {labAppts[0].documents?.length > 0 ? (
                      <div className="no-visit-scans">
                        {labAppts[0].documents.slice(0, 4).map((doc_, i) => (
                          <img key={i} src={doc_.url} className="no-scan-thumb" alt={doc_.name || `document ${i+1}`} />
                        ))}
                      </div>
                    ) : (
                      <p className="no-visit-sub no-visit-empty">No documents attached</p>
                    )}
                  </div>
                )}
              </>
            )}

            {leftFilters.visits && !apptsLoading && visitAppts.length === 0 && (
              <div className="no-card no-card--white no-card--extra" style={{ left: 20, top: 140, width: 330 }}>
                <p className="no-visit-title">No visits yet</p>
                <p className="no-visit-sub">Visit history will show up here once you have an appointment.</p>
              </div>
            )}

            {leftFilters.hospitalisations && !apptsLoading && (
              hospitalisationAppts[0] ? (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 140, width: 200 }}>
                  <p className="no-visit-title">Hospitalisations</p>
                  <p className="no-visit-sub">
                    {(hospitalisationAppts[0].reason || 'Admission')} — {formatApptDate(hospitalisationAppts[0].appointmentDate)}
                  </p>
                </div>
              ) : (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 140, width: 200 }}>
                  <p className="no-visit-title">Hospitalisations</p>
                  <p className="no-visit-sub">None on file</p>
                </div>
              )
            )}

            {leftFilters.procedure && !apptsLoading && (
              procedureAppts[0] ? (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 230, width: 200 }}>
                  <p className="no-visit-title">Procedure</p>
                  <p className="no-visit-sub">
                    {(procedureAppts[0].reason || 'Procedure')} — {formatApptDate(procedureAppts[0].appointmentDate)}
                  </p>
                </div>
              ) : (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 230, width: 200 }}>
                  <p className="no-visit-title">Procedure</p>
                  <p className="no-visit-sub">None on file</p>
                </div>
              )
            )}
            
            {leftFilters.labs && !apptsLoading && (
              labAppts[0] ? (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 320, width: 200 }}>
                  <p className="no-visit-title">Labs</p>
                  <p className="no-visit-sub">
                    {(labAppts[0].reason || 'Lab order')} — {formatApptDate(labAppts[0].appointmentDate)}
                  </p>
                </div>
              ) : (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 320, width: 200 }}>
                  <p className="no-visit-title">Labs</p>
                  <p className="no-visit-sub">None on file</p>
                </div>
              )
            )}
          </div>

          {/* ── Allergy card (draggable) ─────────────── */}

          {cardVisible.allergies && allergy && (
            <div className="no-card no-card--blue no-card--float" style={{ left: allergyPos.left, top: allergyPos.top, width: 355 }}>
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className={allergyFilter === 'past' ? 'active' : ''}
                    onClick={() => setAllergyFilter('past')} style={{ cursor: 'pointer' }}>Past</span>
                  <span className={allergyFilter === 'current' ? 'active' : ''}
                    onClick={() => setAllergyFilter('current')} style={{ cursor: 'pointer' }}>Current</span>
                </div>

                <button className="no-card-close" onClick={() => toggleCard('allergies')}>
                  <img src={close} className="no-card-icon"/>
                </button>
              </div>

              <h2 className="no-card-title">Allergies</h2>

              <div className="no-med-row">
                <div className="no-pollen"> 
                  <img src={pollen} className="no-pollen-icon"/>
                </div>

                <div>
                  <p className="no-med-name">{allergy.name}</p>
                  <div className="no-med-tags"><span>{allergy.type}</span><span>{allergy.severity}</span></div>
                  <p className="no-med-desc">{allergy.desc}</p>

                  {allergy.doctor && (
                    <div className="no-med-profile">
                      <div className="no-med-profile-photo">
                        {doctorPhotoFor(allergy.doctor)
                          ? <img src={doctorPhotoFor(allergy.doctor)} className="no-med-doctor-photo" />
                          : <img src={doctor} className="no-med-doctor-photo" />}
                      </div>

                      <div className="no-med-doctor-assigned">
                        <p className="no-med-doctor">Diagnosed by</p>
                        <p className="no-med-doctor-name">{allergy.doctor}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {filteredAllergies.length > 1 && (
                <div className="no-mini-pagination">
                  {filteredAllergies.map((_, i) => (
                    <button key={i} className={`no-mini-dot${allergyPage === i ? ' active' : ''}`}
                      onClick={() => setAllergyPage(i)} />
                  ))}
                </div>
              )}

              <div className="no-card-footer">
                <div className="no-card-actions">
                  <button className="no-action-circle no-move-handle" onPointerDown={allergyDrag}>
                    <img src={move} className="no-action-icon move"/>
                  </button>
                </div>
              </div>
            </div>
          )}

          {cardVisible.allergies && !allergy && !recordsLoading && (
            <div className="no-card no-card--blue no-card--float" style={{ left: allergyPos.left, top: allergyPos.top, width: 355 }}>
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className={allergyFilter === 'past' ? 'active' : ''}
                    onClick={() => setAllergyFilter('past')} style={{ cursor: 'pointer' }}>Past</span>
                  <span className={allergyFilter === 'current' ? 'active' : ''}
                    onClick={() => setAllergyFilter('current')} style={{ cursor: 'pointer' }}>Current</span>
                </div>
                <button className="no-card-close" onClick={() => toggleCard('allergies')}>
                  <img src={close} className="no-card-icon"/>
                </button>
              </div>
              <h2 className="no-card-title">Allergies</h2>
              <p className="no-med-desc">No {allergyFilter} allergies on file.</p>
            </div>
          )}

          {/* ── Medication card (draggable) ───────────── */}

          {cardVisible.medication && medication && (
            <div className="no-card no-card--blue no-card--float" style={{ left: medicationPos.left, top: medicationPos.top, width: 355, zIndex: 3 }}> 
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className={medicationFilter === 'past' ? 'active' : ''}
                    onClick={() => setMedicationFilter('past')} style={{ cursor: 'pointer' }}>Past</span>
                  <span className={medicationFilter === 'current' ? 'active' : ''}
                    onClick={() => setMedicationFilter('current')} style={{ cursor: 'pointer' }}>Current</span>
                </div>

                <button className="no-card-close" onClick={() => toggleCard('medication')}>
                  <img src={close} className="no-card-icon"/>
                </button>
              </div>

              <h2 className="no-card-title">Medication</h2>

              <div className="no-med-row">
                <div className="no-pill-bottle"> 
                  <img src={pills} className="no-pills-icon"/>
                </div>

                <div>
                  <p className="no-med-name">{medication.name}</p>

                  <div className="no-med-tags">
                    <span>{medication.dose}</span><span>{medication.form}</span>
                    <span>{medication.route}</span><span>{medication.freq}</span>
                  </div>

                  <p className="no-med-desc">{medication.desc}</p>

                  {medication.doctor && (
                    <div className="no-med-profile">
                      <div className="no-med-profile-photo">
                        {doctorPhotoFor(medication.doctor)
                          ? <img src={doctorPhotoFor(medication.doctor)} className="no-med-doctor-photo" />
                          : <img src={doctor} className="no-med-doctor-photo" />}
                      </div>

                      <div className="no-med-doctor-assigned">
                        <p className="no-med-doctor">Prescribed by</p>
                        <p className="no-med-doctor-name">{medication.doctor}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {medication.progress != null && (
                <div className="no-progress">
                  <div className="no-progress-fill" style={{ width: `${medication.progress}%` }} />
                </div>
              )}

              {filteredMedications.length > 1 && (
                <div className="no-mini-pagination">
                  {filteredMedications.map((_, i) => (
                    <button key={i} className={`no-mini-dot${medicationPage === i ? ' active' : ''}`}
                      onClick={() => setMedicationPage(i)} />
                  ))}
                </div>
              )}

              <div className="no-card-footer">
                <div className="no-card-actions">
                  <button className="no-action-circle no-move-handle" onPointerDown={medicationDrag}>
                    <img src={move} className="no-action-icon move"/>
                  </button>
                </div>
              </div>
            </div>
          )}

          {cardVisible.medication && !medication && !recordsLoading && (
            <div className="no-card no-card--blue no-card--float" style={{ left: medicationPos.left, top: medicationPos.top, width: 355, zIndex: 3 }}>
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className={medicationFilter === 'past' ? 'active' : ''}
                    onClick={() => setMedicationFilter('past')} style={{ cursor: 'pointer' }}>Past</span>
                  <span className={medicationFilter === 'current' ? 'active' : ''}
                    onClick={() => setMedicationFilter('current')} style={{ cursor: 'pointer' }}>Current</span>
                </div>
                <button className="no-card-close" onClick={() => toggleCard('medication')}>
                  <img src={close} className="no-card-icon"/>
                </button>
              </div>
              <h2 className="no-card-title">Medication</h2>
              <p className="no-med-desc">No {medicationFilter} medications on file.</p>
            </div>
          )}
        </div>

        <div className="no-timeline">
          <div className="no-timeline-bar" ref={timelineRef} onPointerDown={onTimelinePointerDown}>
            <div className="no-timeline-year-edge">
              <img src={line} className="no-timeline-nav-icon inverted" alt="Previous year" />
              <span className="no-timeline-year-label">{timelineYear}</span>
            </div>

            <div className="no-timeline-months">
              {MONTHS_SHORT.map((m, i) => {
                const activity = timeline[timelineYear]?.[i]
                return (
                  <div key={m} className="no-timeline-month">
                    {activity && (
                      <div className="no-timeline-popover">
                        <span className="no-timeline-popover-label">{m}</span>

                        <div className="no-timeline-popover-content">
                          <div className="no-timeline-popover-icons">
                            {activity.map((type, idx) => (
                              <span key={idx} className="no-timeline-popover-icon" title={type}
                                style={{ background: ACTIVITY_COLORS[type], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                {type === 'visit' && ICONS.note}
                                {type === 'lab' && ICONS.flask}
                                {type === 'procedure' && ICONS.procedure}
                                {type === 'hospitalisation' && ICONS.hospitalisation}
                              </span>
                            ))}
                          </div>
                          
                          <div className="no-timeline-popover-dots">
                            {activity.map((_, idx) => <span key={idx} className="no-timeline-popover-pip" />)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="no-timeline-active">
                      <span className={`no-timeline-dot${activity ? ' active' : ''}`} />
                      <span className="no-timeline-month-label">{m.toLowerCase()}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="no-timeline-year-edge no-timeline-year-edge--next">
              <img src={line} className="no-timeline-nav-icon inverted" alt="Next year" />
              <span className="no-timeline-year-label">{timelineYear + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upcoming appointments popup ─────────────────── */}
      {showUpcoming && !upcomingLoading && currentUpcoming && (
        <div className="no-upcoming-card">
          <div className="no-upcoming-head">
            <h3 className="no-upcoming-title">Upcoming</h3>
            <button className="no-card-close no-upcoming-close" onClick={() => setShowUpcoming(false)}>
              <img src={close} className="no-card-icon normal" alt="" />
            </button>
          </div>

          <div className="no-upcoming-row">
            <div className="no-upcoming-av">
              {currentUpcoming.doctorImage ? (
                <img src={currentUpcoming.doctorImage} className="ns-full-icon" alt="" />
              ) : (
                getInitials(...String(currentUpcoming.doctor || '').replace(/^Dr\.?\s*/i, '').split(' '))
              )}
            </div>

            <div className="no-upcoming-info">
              <p className="no-upcoming-doctor">{currentUpcoming.doctor || 'Doctor'}</p>
              <p className="no-upcoming-type">{currentUpcoming.type || 'Appointment'}</p>
            </div>

            <div className="no-upcoming-badges">
              <span className="no-upcoming-badge">{formatApptDate(currentUpcoming.appointmentDate)}</span>
              <span className="no-upcoming-badge">{formatApptTime(currentUpcoming.appointmentDate)}</span>
            </div>
          </div>

          {upcoming.length > 1 && (
            <div className="no-upcoming-progress">
              <div className="no-upcoming-progress-fill"
                style={{ width: `${((upcomingIdx + 1) / upcoming.length) * 100}%` }} />
            </div>
          )}

          <div className="no-upcoming-footer">
            {upcoming.length > 1 && (
              <div className="no-upcoming-dots">
                {upcoming.map((_, i) => (
                  <button key={i} className={`no-mini-dot${upcomingIdx === i ? ' active' : ''}`}
                    onClick={() => setUpcomingIdx(i)} />
                ))}
              </div>
            )}

            <div className="no-upcoming-nav">
              <button className="no-upcoming-back"
                disabled={upcomingIdx === 0}
                onClick={() => setUpcomingIdx(i => Math.max(0, i - 1))}>
                <img src={left} className="no-card-icon normal" alt="Previous" />
              </button>
              <button className="no-upcoming-next"
                disabled={upcomingIdx >= upcoming.length - 1}
                onClick={() => setUpcomingIdx(i => Math.min(upcoming.length - 1, i + 1))}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {!upcomingLoading && upcoming.length === 0 && (
        <div className="no-upcoming-card no-upcoming-card--empty">
          <p className="no-upcoming-empty-label">No upcoming appointments</p>
        </div>
      )}

      {/* ── Bottom-left: current patient strip ──────────── */}
      <div className="no-doctor-card no-doctor-card--right">
        <div className="no-doctor-av">
          {userProfile?.profilePictureUrl
            ? <img src={userProfile.profilePictureUrl} className="ns-full-icon" alt="" />
            : getInitials(userProfile?.firstName, userProfile?.lastName)}
        </div>
        <div>
          <p className="no-doctor-name">{userProfile?.firstName} {userProfile?.lastName}</p>
          <p className="no-doctor-role">Patient</p>
        </div>
        <button className="no-bell-btn" aria-label="Notifications">
          <img src={notification} className="no-card-icon normal" alt="" />
        </button>
      </div>
    </div>
  )
}