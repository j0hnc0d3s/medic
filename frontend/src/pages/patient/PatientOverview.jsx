// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseOverview.jsx
// CSS  : src/pages/staff/NurseOverview.css
// ─────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import PatientSidebar from './PatientSidebar'
import Calendar from '../../components/Calendar'
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

import scan1 from '../../assets/images/scan1.jpeg';
import scan2 from '../../assets/images/scan2.jpeg';
import scan3 from '../../assets/images/scan3.jpeg';
import scan4 from '../../assets/images/scan4.jpeg';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── Mock data ─────────────────────────────────────────────
const MOCK_ALLERGIES = [
  { id: 1, name: 'Peanuts', type: 'Food', severity: 'Severe',
    desc: 'Patient breaks out with hives and swelling if peanuts or peanut based products are ingested.',
    doctor: 'Dr. Marcel Brown' },
  { id: 2, name: 'Penicillin', type: 'Drug', severity: 'Moderate',
    desc: 'Mild rash and itching reported after administration. Documented during 2024 admission.',
    doctor: 'Dr. Marcel Brown' },
]

const MOCK_MEDICATIONS = [
  { id: 1, name: 'Ibuprofen', dose: '500mg', form: 'Tablet', route: 'Oral', freq: 'Once Daily',
    desc: 'A common over-the-counter pain reliever and anti-inflammatory used to reduce fever, and treat pain from headaches, muscle aches, arthritis, and minor injuries.',
    doctor: 'Dr. Marcel Brown', progress: 70 },
  { id: 2, name: 'Lisinopril', dose: '10mg', form: 'Tablet', route: 'Oral', freq: 'Once Daily',
    desc: 'ACE inhibitor used to manage high blood pressure and reduce strain on the cardiovascular system.',
    doctor: 'Dr. Marcel Brown', progress: 40 },
]

const MOCK_TASKS = {
  18: [
    { id: 1, label: 'Follow up with Martha' },
    { id: 2, label: 'Follow up with Barry' },
  ],
}

const MOCK_AGENDA = {
  18: [
    { id: 1, time: '9:00 AM', label: 'H. Evans — General Consultation' },
    { id: 2, time: '11:30 AM', label: 'M. Vincent — Follow-up' },
  ],
}

const ICONS = {
  plus:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  note:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  move:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>,
  pencil:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  visit: <span style={{ fontSize: 13 }}>📝</span>,
  bell:  <span style={{ fontSize: 15 }}>🔔</span>,
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

const MOCK_TIMELINE = {
  2020: { 5: ['visit'], 8: ['visit', 'lab'] },
  2021: { 1: ['procedure'], 5: ['visit'] },
  2026: { 5: ['visit', 'lab'] },
}
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

const CURRENT_USER = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  role: 'Registered Nurse',
  image: doctor,
  online: true,
  notifications: true,
}

export default function NurseOverview() {
  const [leftFilters, setLeftFilters] = useState({
    visits: true, hospitalisations: false, procedure: false, labs: false,
  })
  const [cardVisible, setCardVisible] = useState({ allergies: true, medication: true })

  const [allergyPage, setAllergyPage]   = useState(0)
  const [medicationPage, setMedicationPage] = useState(0)

  const [allergyPos, allergyDrag]     = useDraggable({ left: 60, top: 360 })
  const [medicationPos, medicationDrag] = useDraggable({ left: 610, top: 230 })

  const [selectedPatient, setSelectedPatient] = useState(null)

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

  const allergy    = MOCK_ALLERGIES[allergyPage]
  const medication  = MOCK_MEDICATIONS[medicationPage]

  const CONNECTOR_LINKS = [
    { id: 'h-v1',   from: 'headaches', to: 'visit1',           active: leftFilters.visits },
    { id: 'h-v2',   from: 'headaches', to: 'visit2',           active: leftFilters.visits },
    { id: 'v2-lv',  from: 'visit2',    to: 'labsVisit',        active: leftFilters.visits },
    { id: 'v1-hos', from: 'visit1',    to: 'hospitalisations', active: leftFilters.hospitalisations },
    { id: 'v1-pro', from: 'visit1',    to: 'procedure',        active: leftFilters.procedure },
    { id: 'lv-ls',  from: 'labsVisit', to: 'labsStandalone',   active: leftFilters.labs },
  ]

  const visibleLinks = CONNECTOR_LINKS.filter(l => l.active)
  const originPoints = [...new Map(visibleLinks.map(l => [l.from, rightMid(l.from)])).entries()]
  const destPoints    = [...new Map(visibleLinks.map(l => [l.to,   leftMid(l.to)])).entries()]

  // ── Calendar grid calc ───────────────────────────────────
  const dayTasks  = MOCK_TASKS[18]  || []
  const dayAgenda = MOCK_AGENDA[18] || []

  return (
    <div className="no-shell">
      <PatientSidebar onSelectPatient={setSelectedPatient} />

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

            {leftFilters.visits && (
              <>
                <div className="no-card no-card--blue condition" style={{ left: 20, top: 140, width: 330 }}>
                  <div className="no-card-tags">
                    <p className="no-card-tag">Tension headache</p>
                    
                    <img src={lightning} className="no-card-icon inverted" />
                  </div>

                  <h2 className="no-card-title">Headaches</h2>

                  <div className="no-card-action condition">
                  </div>
                </div>

                <div className="no-card no-card--white" style={{ left: 610, top: 100, width: 250 }}>
                  <div className="no-visit-head">
                    <div className="no-visit-icon">
                      <img src={notes} className="no-action-icon inverted"/>
                    </div>

                    <div>
                      <p className="no-visit-title">Visits</p>
                      <p className="no-visit-sub">Symptoms and Tests</p>
                    </div>

                    <div className="no-visit-time">4:09 P</div>
                  </div>
                  <div className="no-visit-tags">
                    <span className="no-visit-tag">Stress</span>
                    <span className="no-visit-tag">Dizziness</span>
                    <span className="no-visit-tag">Fever</span>
                  </div>
                </div>

                <div className="no-card no-card--white" style={{ left: 610, top: 370, width: 250 }}>
                  <div className="no-visit-head">
                    <div className="no-visit-icon">
                      <img src={notes} className="no-action-icon inverted"/>
                    </div>

                    <div>
                      <p className="no-visit-title">Visits</p>
                      <p className="no-visit-sub">Scheduled checkup</p>
                    </div>

                    <div className="no-visit-time">4:09 P</div>
                  </div>
                </div>

                <div className="no-card no-card--white" style={{ left: 610, top: 580, width: 270 }}>
                  <div className="no-visit-head">
                    <div className="no-visit-icon">
                      <img src={notes} className="no-action-icon inverted"/>
                    </div>

                    <div>
                      <p className="no-visit-title">Labs</p>
                      <p className="no-visit-sub">Symptoms and Tests</p>
                    </div>
                    
                    <div className="no-visit-time">4:09 P</div>
                  </div>
                  
                  <div className="no-visit-scans">
                    {[scan1, scan2, scan3, scan4].map((src, i) => <img key={i} src={src} className="no-scan-thumb" alt={`scan ${i+1}`} />)}
                  </div>
                </div>
              </>
            )}

            {leftFilters.hospitalisations && (
              <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 140, width: 200 }}>
                <p className="no-visit-title">Hospitalisations</p>
                <p className="no-visit-sub">ED admission — June 2025</p>
              </div>
            )}

            {leftFilters.procedure && (
              <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 230, width: 200 }}>
                <p className="no-visit-title">Procedure</p>
                <p className="no-visit-sub">Appendectomy — March 2024</p>
              </div>
            )}
            
            {leftFilters.labs && (
              <div className="no-card no-card--white no-card--extra" style={{ left: 1080, top: 320, width: 200 }}>
                <p className="no-visit-title">Labs</p>
                <p className="no-visit-sub">Standalone order — CBC panel</p>
              </div>
            )}
          </div>

          {/* ── Allergy card (draggable) ─────────────── */}

          {cardVisible.allergies && allergy && (
            <div className="no-card no-card--blue no-card--float" style={{ left: allergyPos.left, top: allergyPos.top, width: 355 }}>
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className="active">Past</span> <span>Current</span>
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

                  <div className="no-med-profile">
                    <div className="no-med-profile-photo">
                      <img src={doctor} className="no-med-doctor-photo" />
                    </div>

                    <div className="no-med-doctor-assigned">
                      <p className="no-med-doctor">Prescribed by</p>
                      <p className="no-med-doctor-name">{allergy.doctor}</p>
                    </div>
                  </div>
                </div>
              </div>

              {MOCK_ALLERGIES.length > 1 && (
                <div className="no-mini-pagination">
                  {MOCK_ALLERGIES.map((_, i) => (
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

          {/* ── Medication card (draggable) ───────────── */}

          {cardVisible.medication && medication && (
            <div className="no-card no-card--blue no-card--float" style={{ left: medicationPos.left, top: medicationPos.top, width: 355, zIndex: 3 }}> 
              <div className="no-card-toggles">
                <div className="no-card-toggle">
                  <span className="active">Past</span> <span>Current</span>
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

                  <div className="no-med-profile">
                    <div className="no-med-profile-photo">
                      <img src={doctor} className="no-med-doctor-photo" />
                    </div>

                    <div className="no-med-doctor-assigned">
                      <p className="no-med-doctor">Prescribed by</p>
                      <p className="no-med-doctor-name">{medication.doctor}</p>
                    </div>
                  </div>
                </div>
              </div>

              {MOCK_MEDICATIONS.length > 1 && (
                <div className="no-mini-pagination">
                  {MOCK_MEDICATIONS.map((_, i) => (
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
        </div>

        <div className="no-timeline">
          <div className="no-timeline-bar" ref={timelineRef} onPointerDown={onTimelinePointerDown}>
            <div className="no-timeline-year-edge">
              <img src={line} className="no-timeline-nav-icon inverted" alt="Previous year" />
              <span className="no-timeline-year-label">{timelineYear}</span>
            </div>

            <div className="no-timeline-months">
              {MONTHS_SHORT.map((m, i) => {
                const activity = MOCK_TIMELINE[timelineYear]?.[i]
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

      {/* ── Right: calendar / agenda panel ────────────── */}
      <Calendar 
        currentUser={CURRENT_USER}
        dayTasks={dayTasks}
        dayAgenda={dayAgenda}
      />
    </div>
  )
}