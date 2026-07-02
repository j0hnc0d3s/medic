// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseOverview.jsx
// CSS  : src/pages/staff/NurseOverview.css
// ─────────────────────────────────────────────────────────
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  collection, query, where, getDocs, addDoc, updateDoc,
  deleteDoc, doc, getDoc, orderBy, Timestamp
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import NurseSidebar from './NurseSidebar'
import Calendar from '../../components/Calendar'
import './NurseOverview.css'

import close     from '../../assets/inverted/close.png'
import left      from '../../assets/inverted/left.png'
import right     from '../../assets/inverted/right.png'
import edit      from '../../assets/inverted/edit.png'
import add       from '../../assets/black/plus.png'
import notes     from '../../assets/black/notes.png'
import move      from '../../assets/black/move.png'
import lightning from '../../assets/black/lightning.png'
import pencil    from '../../assets/black/pencil.png'
import line      from '../../assets/black/line.png'

import reverse_triangle from '../../assets/images/reverse_triangle.png'
import triangle         from '../../assets/images/triangle.png'
import pills  from '../../assets/images/pills.png'
import pollen from '../../assets/images/pollen.png'
import doctor from '../../assets/images/doctor1.jpeg'

const MONTHS_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const ACTIVITY_COLORS = {
  visit: '#0066ff', lab: '#161c18', procedure: '#0b51f5', hospitalisation: '#152fdb'
}
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

const ICONS = {
  plus:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  note:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  move:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>,
  pencil:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  flask: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  procedure: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M5 9l-3 3 3 3M19 9l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  hospitalisation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 11h6M12 8v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

// ── Card layout positions (fixed visual structure) ─────────
const CARD_POS = {
  condition:        { left: 20,  top: 140, width: 330, height: 177 },
  visit1:           { left: 610, top: 100, width: 250, height: 178 },
  visit2:           { left: 610, top: 370, width: 250, height: 76  },
  labsVisit:        { left: 610, top: 580, width: 270, height: 216 },
  hospitalisations: { left: 1080, top: 140, width: 200, height: 60 },
  procedure:        { left: 1080, top: 230, width: 200, height: 60 },
  labsStandalone:   { left: 1080, top: 320, width: 200, height: 60 },
}
const rightMid = k => ({ x: CARD_POS[k].left + CARD_POS[k].width, y: CARD_POS[k].top + CARD_POS[k].height / 2 })
const leftMid  = k => ({ x: CARD_POS[k].left, y: CARD_POS[k].top + CARD_POS[k].height / 2 })

function elbowPath(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dy) < 1) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  const radius = Math.min(20, Math.abs(dx) / 3, Math.abs(dy) / 2)
  const midX   = from.x + dx / 2
  const dir    = dy > 0 ? 1 : -1
  return `M ${from.x} ${from.y}
    L ${midX - radius} ${from.y}
    Q ${midX} ${from.y} ${midX} ${from.y + radius * dir}
    L ${midX} ${to.y - radius * dir}
    Q ${midX} ${to.y} ${midX + radius} ${to.y}
    L ${to.x} ${to.y}`
}

const DestTriangle = ({ x, y, size = 14 }) => (
  <img src={reverse_triangle} className="no-dest-triangle" alt=""
    style={{ left: x - size, top: y - size / 2, width: size, height: size }} />
)
const ConnectorNode = ({ x, y }) => (
  <div className="no-connector-node" style={{ left: x - 16, top: y - 16 }}>
    <img src={triangle} className="no-connector-triangle" alt="" />
  </div>
)

// ── Draggable hook ──────────────────────────────────────────
function useDraggable(initial) {
  const [pos, setPos] = useState(initial)
  const onPointerDown = e => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const origin = { ...pos }
    const onMove = ev => setPos({ left: origin.left + (ev.clientX - startX), top: origin.top + (ev.clientY - startY) })
    const onUp   = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  return [pos, onPointerDown]
}

// ── Format appointment date ─────────────────────────────────
const fmtApptDate = ts => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ══════════════════════════════════════════════════════════
export default function NurseOverview() {
  const { userProfile } = useAuth()

  // ── Current user from auth context ───────────────────────
  const currentUser = useMemo(() => ({
    firstName: userProfile?.firstName || 'Staff',
    lastName:  userProfile?.lastName  || '',
    role:      userProfile?.role      || 'Staff',
    image:     userProfile?.profilePictureUrl || doctor,
    online:    true,
    notifications: true,
  }), [userProfile])

  // ── UI state ──────────────────────────────────────────────
  const [leftFilters, setLeftFilters] = useState({
    visits: true, hospitalisations: false, procedure: false, labs: false,
  })
  const [cardVisible,     setCardVisible]     = useState({ allergies: true, medication: true })
  const [allergyPage,     setAllergyPage]     = useState(0)
  const [medicationPage,  setMedicationPage]  = useState(0)
  const [allergyPos,      allergyDrag]        = useDraggable({ left: 60,  top: 360 })
  const [medicationPos,   medicationDrag]     = useDraggable({ left: 610, top: 230 })
  const [timelineYear,    setTimelineYear]    = useState(new Date().getFullYear())
  const [isTimelineSpinning, setIsTimelineSpinning] = useState(false)
  const canvasRef   = useRef(null)
  const timelineRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1100, height: 680 })

  // ── Data state ────────────────────────────────────────────
  const [selectedPatient,     setSelectedPatient]     = useState(null)
  const [allergies,           setAllergies]           = useState([])
  const [medications,         setMedications]         = useState([])
  const [patientAppointments, setPatientAppointments] = useState([])
  const [patientCondition,    setPatientCondition]    = useState(null)
  const [timeline,            setTimeline]            = useState({})
  const [loadingPatient,      setLoadingPatient]      = useState(false)

  // Calendar
  const [todayAgenda, setTodayAgenda] = useState([])
  const [tasks,       setTasks]       = useState([])
  const [newTask,     setNewTask]     = useState('')

  // ── Canvas resize observer ────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Fetch today's appointments for calendar ───────────────
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const today    = new Date(); today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

        const snap = await getDocs(query(
          collection(db, 'appointments'),
          where('appointmentDate', '>=', Timestamp.fromDate(today)),
          where('appointmentDate', '<',  Timestamp.fromDate(tomorrow)),
          orderBy('appointmentDate')
        ))
        setTodayAgenda(snap.docs.map(d => ({
          id:    d.id,
          time:  d.data().appointmentTime || '—',
          label: `${d.data().patientName} — ${d.data().type || 'Appointment'}`,
        })))
      } catch (err) {
        console.error('Failed to load today appointments:', err)
        setTodayAgenda([])
      }
    }
    fetchToday()
  }, [])

  // ── Fetch tasks for logged-in user ────────────────────────
  useEffect(() => {
    if (!userProfile?.uid) return
    const fetchTasks = async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'tasks'),
          where('userId', '==', userProfile.uid),
          where('completed', '==', false),
          orderBy('createdAt', 'desc')
        ))
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {
        // tasks collection may not exist yet — silently show empty
        setTasks([])
      }
    }
    fetchTasks()
  }, [userProfile?.uid])

  // ── Fetch patient data when sidebar selection changes ─────
  useEffect(() => {
    if (!selectedPatient?.id) {
      setAllergies([])
      setMedications([])
      setPatientAppointments([])
      setPatientCondition(null)
      setTimeline({})
      setAllergyPage(0)
      setMedicationPage(0)
      return
    }
    fetchPatientData(selectedPatient)
  }, [selectedPatient?.id])

  const fetchPatientData = async (patient) => {
    setLoadingPatient(true)
    try {
      // ── Medical record ──────────────────────────────────
      try {
        const recordDoc = await getDoc(
          doc(db, 'users', patient.id, 'medicalRecords', 'main')
        )
        if (recordDoc.exists()) {
          const data = recordDoc.data()

          setAllergies((data.allergies || []).map((name, i) => ({
            id: i, name, type: 'Allergy', severity: 'See notes', desc: '', doctor: '—'
          })))

          setMedications((data.currentMedications || []).map((name, i) => ({
            id: i, name, dose: '—', form: '—', route: '—', freq: '—', desc: '', doctor: '—', progress: 0
          })))

          const conditions = data.conditions || []
          setPatientCondition(conditions[0] || null)
        } else {
          // Fall back to sidebar data which already has diagnosis/allergy info
          setPatientCondition(patient.diagnosis?.name || null)
          setAllergies([])
          setMedications([])
        }
      } catch {
        setPatientCondition(patient.diagnosis?.name || null)
        setAllergies([])
        setMedications([])
      }

      // ── Appointments for canvas + timeline ──────────────
      // Query by patientName since that's what the UI stores
      const name = `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
        || `${patient.firstName}.${patient.lastName}`.trim()

      const apptSnap = await getDocs(query(
        collection(db, 'appointments'),
        where('patientName', '==', name),
        orderBy('appointmentDate', 'desc')
      ))
      const appts = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setPatientAppointments(appts)

      // ── Build timeline from appointment dates ───────────
      const tl = {}
      appts.forEach(a => {
        const date = a.appointmentDate?.toDate?.()
        if (!date) return
        const yr = date.getFullYear()
        const mo = date.getMonth()
        if (!tl[yr]) tl[yr] = {}
        if (!tl[yr][mo]) tl[yr][mo] = []
        const type = a.type === 'Lab Work'        ? 'lab'
                   : a.type === 'Procedure'        ? 'procedure'
                   : a.type === 'Specialist'       ? 'hospitalisation'
                   : 'visit'
        if (!tl[yr][mo].includes(type)) tl[yr][mo].push(type)
      })
      setTimeline(tl)

    } catch (err) {
      console.error('Error fetching patient data:', err)
    } finally {
      setLoadingPatient(false)
    }
  }

  // ── Task management ───────────────────────────────────────
  const addTask = async () => {
    if (!newTask.trim() || !userProfile?.uid) return
    const taskData = {
      userId:    userProfile.uid,
      label:     newTask.trim(),
      completed: false,
      createdAt: Timestamp.now(),
    }
    try {
      const ref = await addDoc(collection(db, 'tasks'), taskData)
      setTasks(t => [{ id: ref.id, ...taskData }, ...t])
      setNewTask('')
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }

  const completeTask = async (taskId) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { completed: true })
      setTasks(t => t.filter(x => x.id !== taskId))
    } catch (err) {
      console.error('Failed to complete task:', err)
    }
  }

  // ── Derive canvas sections from real appointments ─────────
  const visitAppts = patientAppointments
    .filter(a => !['Lab Work', 'Procedure'].includes(a.type))
    .slice(0, 2)

  const labAppts = patientAppointments
    .filter(a => a.type === 'Lab Work')
    .slice(0, 1)

  const hospitalisationAppts = patientAppointments
    .filter(a => a.type === 'Hospitalisation' || a.type === 'Emergency')
    .slice(0, 1)

  const procedureAppts = patientAppointments
    .filter(a => a.type === 'Procedure')
    .slice(0, 1)

  // ── Allergy/medication current page items ─────────────────
  const allergy   = allergies[allergyPage]   || null
  const medication = medications[medicationPage] || null

  // ── Connector visibility (based on real data + filter) ────
  const hasVisits        = leftFilters.visits        && visitAppts.length > 0 && !!patientCondition
  const hasLabs          = leftFilters.labs          && labAppts.length > 0
  const hasHospital      = leftFilters.hospitalisations && hospitalisationAppts.length > 0
  const hasProcedure     = leftFilters.procedure     && procedureAppts.length > 0

  const CONNECTOR_LINKS = [
    { id: 'c-v1', from: 'condition', to: 'visit1',           active: hasVisits && visitAppts.length >= 1 },
    { id: 'c-v2', from: 'condition', to: 'visit2',           active: hasVisits && visitAppts.length >= 2 },
    { id: 'v2-lv', from: 'visit2',  to: 'labsVisit',        active: hasVisits && hasLabs },
    { id: 'v1-h', from: 'visit1',   to: 'hospitalisations', active: hasHospital },
    { id: 'v1-p', from: 'visit1',   to: 'procedure',        active: hasProcedure },
    { id: 'lv-ls', from: 'labsVisit', to: 'labsStandalone', active: hasLabs },
  ]

  const visibleLinks  = CONNECTOR_LINKS.filter(l => l.active)
  const originPoints  = [...new Map(visibleLinks.map(l => [l.from, rightMid(l.from)])).entries()]
  const destPoints    = [...new Map(visibleLinks.map(l => [l.to, leftMid(l.to)])).entries()]

  // ── Timeline swipe ────────────────────────────────────────
  const onTimelinePointerDown = e => {
    e.preventDefault()
    const startX = e.clientX
    const onUp = ev => {
      const dist = startX - ev.clientX
      if (Math.abs(dist) > 50) {
        setIsTimelineSpinning(true)
        setTimelineYear(y => dist > 0
          ? (y === YEARS[YEARS.length - 1] ? YEARS[0] : y + 1)
          : (y === YEARS[0] ? YEARS[YEARS.length - 1] : y - 1))
        setTimeout(() => setIsTimelineSpinning(false), 600)
      }
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointerup', onUp)
  }

  const toggleCard      = key => setCardVisible(c => ({ ...c, [key]: !c[key] }))
  const toggleFilter    = key => { if (key !== 'visits') setLeftFilters(f => ({ ...f, [key]: !f[key] })) }

  // ── Calendar props ────────────────────────────────────────
  // Tasks go into Calendar as dayTasks; agenda is today's real appointments
  const calendarTasks  = tasks.map(t => ({ id: t.id, label: t.label }))
  const calendarAgenda = todayAgenda

  // ─────────────────────────────────────────────────────────

  return (
    <div className="no-shell">
      <NurseSidebar onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        {/* ── Filter pills ──────────────────────────────── */}
        <div className="no-filters">
          <div className="no-filter-group">
            {[
              { key: 'visits',           label: 'Visits'           },
              { key: 'hospitalisations', label: 'Hospitalisations' },
              { key: 'procedure',        label: 'Procedure'        },
              { key: 'labs',             label: 'Labs'             },
            ].map(f => (
              <button key={f.key}
                className={`no-filter-pill${leftFilters[f.key] ? ' active' : ''}${f.key === 'visits' ? ' locked' : ''}`}
                onClick={() => toggleFilter(f.key)}>
                <span className="no-filter-dot" />{f.label}
              </button>
            ))}
          </div>

          <div className="no-filter-group">
            {[
              { key: 'allergies',  label: 'Allergies'  },
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

        {/* ── Canvas ──────────────────────────────────────── */}
        <div className="no-canvas" ref={canvasRef}>

          {/* Empty state when no patient selected */}
          {!selectedPatient && (
            <div className="no-canvas-empty">
              <p className="no-canvas-empty-text">Select a patient from the sidebar to view their medical overview.</p>
            </div>
          )}

          {selectedPatient && loadingPatient && (
            <div className="no-canvas-empty">
              <p className="no-canvas-empty-text">Loading patient data…</p>
            </div>
          )}

          {selectedPatient && !loadingPatient && (
            <div className="no-history">
              {/* Connectors */}
              <svg className="no-connectors"
                viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                preserveAspectRatio="none">
                {visibleLinks.map(l => (
                  <path key={l.id} d={elbowPath(rightMid(l.from), leftMid(l.to))} className="no-line" />
                ))}
              </svg>

              {originPoints.map(([key, pos]) => <ConnectorNode key={key} x={pos.x} y={pos.y} />)}
              {destPoints.map(([key, pos])   => <DestTriangle  key={key} x={pos.x} y={pos.y} />)}

              {/* ── Condition card ───────────────────────── */}
              {leftFilters.visits && patientCondition && (
                <div className="no-card no-card--blue condition" style={{ left: 20, top: 140, width: 330 }}>
                  <div className="no-card-tags">
                    <p className="no-card-tag">{patientCondition}</p>
                    <img src={lightning} className="no-card-icon inverted" />
                  </div>
                  <h2 className="no-card-title">
                    {selectedPatient.diagnosis?.name || patientCondition}
                  </h2>
                  <div className="no-card-action condition">
                    <button className="no-action-circle"><img src={pencil} className="no-action-icon normal"/></button>
                    <button className="no-action-circle"><img src={notes}  className="no-action-icon"/></button>
                  </div>
                </div>
              )}

              {leftFilters.visits && !patientCondition && (
                <div className="no-card no-card--blue condition" style={{ left: 20, top: 140, width: 330 }}>
                  <p className="no-canvas-empty-text" style={{ padding: '16px 0', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    No conditions on record
                  </p>
                </div>
              )}

              {/* ── Visit cards (from real appointments) ─── */}
              {leftFilters.visits && visitAppts[0] && (
                <div className="no-card no-card--white" style={{ left: 610, top: 100, width: 250 }}>
                  <div className="no-visit-head">
                    <div className="no-visit-icon"><img src={notes} className="no-action-icon inverted"/></div>
                    <div>
                      <p className="no-visit-title">{visitAppts[0].type || 'Visit'}</p>
                      <p className="no-visit-sub">{visitAppts[0].notes || 'General appointment'}</p>
                    </div>
                    <div className="no-visit-time">{visitAppts[0].appointmentTime || '—'}</div>
                  </div>
                  {visitAppts[0].type && (
                    <div className="no-visit-tags">
                      <span className="no-visit-tag">{fmtApptDate(visitAppts[0].appointmentDate)}</span>
                      {visitAppts[0].doctor && <span className="no-visit-tag">{visitAppts[0].doctor}</span>}
                    </div>
                  )}
                </div>
              )}

              {leftFilters.visits && visitAppts[1] && (
                <div className="no-card no-card--white" style={{ left: 610, top: 370, width: 250 }}>
                  <div className="no-visit-head">
                    <div className="no-visit-icon"><img src={notes} className="no-action-icon inverted"/></div>
                    <div>
                      <p className="no-visit-title">{visitAppts[1].type || 'Visit'}</p>
                      <p className="no-visit-sub">{visitAppts[1].notes || 'General appointment'}</p>
                    </div>
                    <div className="no-visit-time">{visitAppts[1].appointmentTime || '—'}</div>
                  </div>
                </div>
              )}

              {/* ── Lab card ─────────────────────────────── */}
              {leftFilters.labs && labAppts[0] && (
                <div className="no-card no-card--white" style={{ left: 610, top: 580, width: 270 }}>
                  <div className="no-visit-head">
                    <div className="no-visit-icon"><img src={notes} className="no-action-icon inverted"/></div>
                    <div>
                      <p className="no-visit-title">Labs</p>
                      <p className="no-visit-sub">{labAppts[0].notes || 'Lab work order'}</p>
                    </div>
                    <div className="no-visit-time">{fmtApptDate(labAppts[0].appointmentDate)}</div>
                  </div>
                </div>
              )}

              {/* ── Hospitalisations card ────────────────── */}
              {leftFilters.hospitalisations && hospitalisationAppts[0] && (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 140, width: 200 }}>
                  <p className="no-visit-title">Hospitalisation</p>
                  <p className="no-visit-sub">{fmtApptDate(hospitalisationAppts[0].appointmentDate)}</p>
                </div>
              )}

              {leftFilters.hospitalisations && hospitalisationAppts.length === 0 && (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 140, width: 200, opacity: 0.4 }}>
                  <p className="no-visit-title">Hospitalisations</p>
                  <p className="no-visit-sub">None on record</p>
                </div>
              )}

              {/* ── Procedure card ───────────────────────── */}
              {leftFilters.procedure && procedureAppts[0] && (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 230, width: 200 }}>
                  <p className="no-visit-title">Procedure</p>
                  <p className="no-visit-sub">{procedureAppts[0].notes || fmtApptDate(procedureAppts[0].appointmentDate)}</p>
                </div>
              )}

              {leftFilters.procedure && procedureAppts.length === 0 && (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 230, width: 200, opacity: 0.4 }}>
                  <p className="no-visit-title">Procedure</p>
                  <p className="no-visit-sub">None on record</p>
                </div>
              )}

              {/* ── Standalone labs card ─────────────────── */}
              {leftFilters.labs && labAppts[0] && (
                <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 320, width: 200 }}>
                  <p className="no-visit-title">Labs</p>
                  <p className="no-visit-sub">{labAppts[0].notes || fmtApptDate(labAppts[0].appointmentDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Allergy card (draggable) ─────────────────── */}
          {cardVisible.allergies && selectedPatient && !loadingPatient && (
            <div className="no-card no-card--blue no-card--float"
              style={{ left: allergyPos.left, top: allergyPos.top, width: 355, zIndex: 3 }}>
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className="active">Current</span>
                </div>
                <button className="no-card-close" onClick={() => toggleCard('allergies')}>
                  <img src={close} className="no-card-icon"/>
                </button>
              </div>

              <h2 className="no-card-title">Allergies</h2>

              {allergies.length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '8px 0' }}>
                  No allergies on record.
                </p>
              ) : (
                <>
                  <div className="no-med-row">
                    <div className="no-pollen"><img src={pollen} className="no-pollen-icon"/></div>
                    <div>
                      <p className="no-med-name">{allergy?.name}</p>
                      <div className="no-med-tags">
                        <span>{allergy?.type}</span>
                        {allergy?.severity !== '—' && <span>{allergy?.severity}</span>}
                      </div>
                      {allergy?.desc && <p className="no-med-desc">{allergy.desc}</p>}
                    </div>
                  </div>

                  {allergies.length > 1 && (
                    <div className="no-mini-pagination">
                      {allergies.map((_, i) => (
                        <button key={i}
                          className={`no-mini-dot${allergyPage === i ? ' active' : ''}`}
                          onClick={() => setAllergyPage(i)} />
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="no-card-footer">
                <div className="no-card-actions">
                  <div className="no-card-action">
                    <button className="no-action-circle"><img src={add}   className="no-action-icon"/></button>
                    <button className="no-action-circle"><img src={notes} className="no-action-icon"/></button>
                  </div>
                  <button className="no-action-circle no-move-handle" onPointerDown={allergyDrag}>
                    <img src={move} className="no-action-icon move"/>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Medication card (draggable) ──────────────── */}
          {cardVisible.medication && selectedPatient && !loadingPatient && (
            <div className="no-card no-card--blue no-card--float"
              style={{ left: medicationPos.left, top: medicationPos.top, width: 355, zIndex: 3 }}>
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className="active">Current</span>
                </div>
                <button className="no-card-close" onClick={() => toggleCard('medication')}>
                  <img src={close} className="no-card-icon"/>
                </button>
              </div>

              <h2 className="no-card-title">Medication</h2>

              {medications.length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '8px 0' }}>
                  No medications on record.
                </p>
              ) : (
                <>
                  <div className="no-med-row">
                    <div className="no-pill-bottle"><img src={pills} className="no-pills-icon"/></div>
                    <div>
                      <p className="no-med-name">{medication?.name}</p>
                      <div className="no-med-tags">
                        {medication?.dose !== '—' && <span>{medication?.dose}</span>}
                        {medication?.form !== '—' && <span>{medication?.form}</span>}
                        {medication?.route !== '—' && <span>{medication?.route}</span>}
                        {medication?.freq !== '—' && <span>{medication?.freq}</span>}
                      </div>
                      {medication?.desc && <p className="no-med-desc">{medication.desc}</p>}
                    </div>
                  </div>

                  {medications.length > 1 && (
                    <div className="no-mini-pagination">
                      {medications.map((_, i) => (
                        <button key={i}
                          className={`no-mini-dot${medicationPage === i ? ' active' : ''}`}
                          onClick={() => setMedicationPage(i)} />
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="no-card-footer">
                <div className="no-card-actions">
                  <div className="no-card-action">
                    <button className="no-action-circle"><img src={add}   className="no-action-icon"/></button>
                    <button className="no-action-circle"><img src={notes} className="no-action-icon"/></button>
                  </div>
                  <button className="no-action-circle no-move-handle" onPointerDown={medicationDrag}>
                    <img src={move} className="no-action-icon move"/>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Timeline bar ───────────────────────────────── */}
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
                              <span key={idx} className="no-timeline-popover-icon"
                                style={{ background: ACTIVITY_COLORS[type], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                                title={type}>
                                {type === 'visit'          && ICONS.note}
                                {type === 'lab'            && ICONS.flask}
                                {type === 'procedure'      && ICONS.procedure}
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

      {/* ── Calendar with real data ─────────────────────── */}
      <Calendar
        currentUser={currentUser}
        dayTasks={calendarTasks}
        dayAgenda={calendarAgenda}
        onAddTask={addTask}
        onCompleteTask={completeTask}
        newTaskValue={newTask}
        onNewTaskChange={setNewTask}
      />
    </div>
  )
}