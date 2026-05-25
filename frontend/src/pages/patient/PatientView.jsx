// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientView.jsx
// CSS  : src/pages/styles/PatientView.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, query, where, orderBy,
  limit, getDocs, Timestamp,
} from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import '../styles/PatientView.css'

import heart      from '../../assets/images/heart.png'
import homeImg    from '../../assets/images/home.png'
import phoneImg   from '../../assets/images/phone.png'
import clockImg   from '../../assets/images/clock.png'
import schedImg   from '../../assets/images/schedule.png'

// ── Placeholder icon imports — swap filenames to match your assets ─
import heartIcon  from '../../assets/images/love.png'    
import pulseIcon  from '../../assets/images/activity.png'     
import docIcon    from '../../assets/images/document.png'     
import chevronL   from '../../assets/images/left.png'       
import chevronR   from '../../assets/images/right.png'      
import avatar1    from '../../assets/images/user1.jpeg'    
import avatar2    from '../../assets/images/user2.jpg'      
import medImg1    from '../../assets/images/bottle.png'       
import medImg2    from '../../assets/images/bottle.png'       
import medImg3    from '../../assets/images/bottle.png'       

// ── Static / placeholder data ─────────────────────────────
const PILL_FILTERS = ['All', 'Tests', 'Labs', 'Docs']
const DAY_NAMES    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Bar heights (relative units, 1-15)
const BARS_1 = [2,5,9,14,6,11,4,8,12,7,13,5,9,3,7,10,14,6,8,4]
const BARS_2 = [3,7,4,10,6,12,3,8,5,11,4,9,6,3,7,10,5,8,12,3]

// Placeholder meds — swap for Firestore when meds collection exists
const MEDS = [
  { idx: '01', name: 'OMEGA 3',   dose: '2.5 mg' }, 
  { idx: '02', name: 'ALFUBIN 3', dose: '2.5 mg' },
  { idx: '03', name: 'OMEGA 3',   dose: '2.5 mg' },
]

const DIAGNOSIS_TEXT =
  'Patient presents with controlled hypertension managed with current ' +
  'medication. Blood pressure readings within acceptable range. ' +
  'Follow-up recommended in 3 months. No acute concerns at this time.'

// Used when Firestore returns < 2 upcoming appointments
const FALLBACK_APPTS = [
  { id: 'f1', doctorName: 'Dr. Wesley Cain',  specialty: 'Cardiologist', type: 'Blood Pressure', label: 'Test', displayDate: '28 Feb', active: true  },
  { id: 'f2', doctorName: 'Dr. Presley Lee',  specialty: 'Cardiologist', type: 'Cardiogram',     label: 'Test', displayDate: '28 Feb', active: false },
]

// ── Helpers ───────────────────────────────────────────────
const mkInit = (n = '') =>
  n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

const fmtShort = ts => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

const fmtTime = ts => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const isToday = d => {
  const t = new Date()
  return d.getDate() === t.getDate() &&
    d.getMonth()    === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
}

function getWeekDates(offset = 0) {
  const today = new Date()
  const dow   = today.getDay()
  const mon   = new Date(today)
  mon.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

// ── Bar chart ─────────────────────────────────────────────
function BarChart({ bars, dim = false }) {
  const max = Math.max(...bars)
  const W = 220, H = 70, bW = 7
  const gap = (W - bars.length * bW) / (bars.length - 1)
  return (
    <svg
      width="100%" height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="pv-bars"
      aria-hidden="true"
    >
      {bars.map((v, i) => {
        const bH = Math.max(4, (v / max) * (H - 6))
        return (
          <rect
            key={i}
            x={i * (bW + gap)} y={H - bH}
            width={bW} height={bH}
            rx="2.5"
            fill={dim ? '#D8E8F2' : '#567C8D'}
            opacity={dim ? 0.5 : 0.35 + (v / max) * 0.65}
          />
        )
      })}
    </svg>
  )
}

// ── Icon helpers removed — using PNG imports throughout ──────────

// ── Main component ────────────────────────────────────────
export default function PatientView() {
  const { userProfile, loading } = useAuth()
  const navigate = useNavigate()

  // UI state
  const [activeFilter,  setActiveFilter]  = useState('Tests')
  const [centerView,    setCenterView]    = useState('vitals')  // vitals | stats | docs
  const [rightTab,      setRightTab]      = useState('meds')    // meds | diagnosis
  const [weekOffset,    setWeekOffset]    = useState(0)

  // Data state
  const [weekDates,     setWeekDates]     = useState(() => getWeekDates(0))
  const [weekAppts,     setWeekAppts]     = useState([])
  const [upcomingAppts, setUpcomingAppts] = useState([])

  useEffect(() => { setWeekDates(getWeekDates(weekOffset)) }, [weekOffset])

  useEffect(() => {
    if (userProfile?.uid) {
      loadUpcoming()
    }
  }, [userProfile])

  useEffect(() => {
    if (userProfile?.uid && weekDates.length) loadWeekAppts()
  }, [userProfile, weekDates])

  const loadUpcoming = async () => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', userProfile.uid),
        where('appointmentDate', '>=', Timestamp.fromDate(new Date())),
        orderBy('appointmentDate', 'asc'),
        limit(2)
      )
      const snap = await getDocs(q)
      setUpcomingAppts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error('loadUpcoming:', e) }
  }

  const loadWeekAppts = async () => {
    try {
      const start = new Date(weekDates[0]); start.setHours(0,0,0,0)
      const end   = new Date(weekDates[6]); end.setHours(23,59,59,999)
      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', userProfile.uid),
        where('appointmentDate', '>=', Timestamp.fromDate(start)),
        where('appointmentDate', '<=', Timestamp.fromDate(end))
      )
      const snap = await getDocs(q)
      setWeekAppts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error('loadWeekAppts:', e) }
  }

  const getByDate = date =>
    weekAppts.filter(a => {
      const d = a.appointmentDate?.toDate()
      return d &&
        d.getDate()     === date.getDate()     &&
        d.getMonth()    === date.getMonth()    &&
        d.getFullYear() === date.getFullYear()
    })

  const showReal  = upcomingAppts.length >= 2
  const apptCards = showReal ? upcomingAppts.slice(0, 2) : FALLBACK_APPTS

  if (loading) {
    return <div className="pv-loading"><div className="pv-spinner" /></div>
  }

  const firstName = userProfile?.firstName || 'Patient'

  return (
    <div className="pv-shell">

      {/* ── Left icon sidebar ──────────────────────── */}
      <div className="pv-aside">
        {[
          { img: homeImg,  path: '/patient/overview',     title: 'Home',         active: true  },
          { img: phoneImg, path: '/patient/messaging',    title: 'Messaging',    active: false },
          { img: clockImg, path: '/patient/appointments', title: 'Appointments', active: false },
          { img: schedImg, path: '/patient/calendar',     title: 'Calendar',     active: false },
        ].map(({ img, path, title, active }) => (
          <button
            key={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
            title={title}
            aria-label={title}
          >
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </div>

      {/* ── Page content ───────────────────────────── */}
      <div className="pv-page">

        {/* ══ Upper 3-col ══════════════════════════ */}
        <div className="pv-upper">

          {/* ── LEFT: Essentials ───────────────────── */}
          <section className="pv-left">
            <h1 className="pv-section-heading">The Essentials</h1>

            {/* Filter pills */}
            <div className="pv-pills">
              {PILL_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`pv-pill${activeFilter === f ? ' active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Appointment cards */}
            <div className="pv-appt-row">
              {apptCards.map((appt, i) => {
                const name  = showReal ? (appt.doctorName  || 'Doctor')                : appt.doctorName
                const spec  = showReal ? (appt.specialty   || '')                       : appt.specialty
                const type  = showReal ? (appt.type || appt.reason || 'Appointment')   : appt.type
                const date  = showReal ? fmtShort(appt.appointmentDate)                : appt.displayDate
                const dim   = i === 1  // second card is muted like the Figma
                const avImg = i === 0 ? avatar1 : avatar2
                return (
                  <div
                    key={appt.id}
                    className={`pv-appt-card${dim ? ' dim' : ''}`}
                  >
                    <div className="pv-appt-top">
                      <div className={`pv-dr-av pv-av${i + 1}`}>
                        <img src={avImg} alt={name} className="pv-dr-av-img" />
                      </div>
                      <div>
                        <p className="pv-dr-name">{name}</p>
                        <p className="pv-dr-spec">{spec}</p>
                      </div>
                    </div>
                    <p className="pv-appt-type">{type}</p>
                    <p className="pv-appt-sub">Test</p>
                    <p className="pv-appt-date">{date}</p>
                    <BarChart bars={i === 0 ? BARS_1 : BARS_2} dim={dim} />
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── CENTER: Health visual ──────────────── */}
          <section className="pv-center">
            {/* Stats — left of the image */}
            <div className="pv-center-stats">
              {centerView === 'vitals' && (<>
                <p className="pv-big-stat">{userProfile?.bloodType || 'B+'}</p>
                <p className="pv-stat-label">Blood</p>
                <p className="pv-bp-stat">
                  <strong>{userProfile?.systolic || '115'}</strong>
                  <span>/{userProfile?.diastolic || '70'}</span>
                </p>
                <p className="pv-stat-label">Pressure</p>
              </>)}

              {centerView === 'stats' && (<>
                <p className="pv-big-stat" style={{ fontSize: '36px' }}>
                  {userProfile?.weight || '180'}
                </p>
                <p className="pv-stat-label">lbs</p>
                <p className="pv-bp-stat" style={{ marginTop: '14px' }}>
                  <strong>{userProfile?.heightFt || "5'11\""}</strong>
                </p>
                <p className="pv-stat-label">Height</p>
                <p className="pv-bp-stat" style={{ marginTop: '14px' }}>
                  <strong>{userProfile?.bmi || '23.4'}</strong>
                </p>
                <p className="pv-stat-label">BMI · Normal</p>
              </>)}

              {centerView === 'docs' && (
                <p className="pv-docs-text">{DIAGNOSIS_TEXT}</p>
              )}
            </div>

            {/* Body image + icon switcher */}
            <div className="pv-center-image">
              <img src={heart} alt="" className="pv-body-img" />

              <div className="pv-center-icons">
                {[
                  { key: 'vitals', img: heartIcon },
                  { key: 'stats',  img: pulseIcon },
                  { key: 'docs',   img: docIcon   },
                ].map(({ key, img }) => (
                  <button
                    key={key}
                    className={`pv-center-icon${centerView === key ? ' active' : ''}`}
                    onClick={() => setCenterView(key)}
                    aria-label={key}
                  >
                    <img src={img} alt={key} className="pv-center-icon-img" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── RIGHT: Medication & Supplements ───── */}
          <section className="pv-right">
            <div className="pv-right-head">
              <h2 className="pv-right-title">
                Your<br />Medication &amp;<br />Supplements
              </h2>
              <button className="pv-right-arrow" aria-label="See all">
                <img src={chevronR} alt="" className="pv-arrow-icon" />
              </button>
            </div>

            {rightTab === 'meds' && (
              <div className="pv-med-grid">
                {[
                  { ...MEDS[0], img: medImg1 },
                  { ...MEDS[1], img: medImg2 },
                  { ...MEDS[2], img: medImg3 },
                ].map(m => (
                  <div key={m.idx} className="pv-med-card">
                    <div className="pv-med-top">
                      <span className="pv-med-n">{m.idx}</span>

                      <div className="pv-med-side">
                        <span className="pv-med-name">{m.name}</span>
                        <span className="pv-med-dose">{m.dose}</span>
                      </div>
                    </div>

                    <div className="pv-med-img-wrap">
                      <img src={m.img} alt={m.name} className="pv-med-img" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rightTab === 'diagnosis' && (
              <div className="pv-diagnosis-panel">
                <p className="pv-diag-label">Current Diagnosis</p>
                <p className="pv-diag-text">{DIAGNOSIS_TEXT}</p>
                <div className="pv-diag-tags">
                  <span className="pv-diag-tag">Hypertension</span>
                  <span className="pv-diag-tag">Stage 1</span>
                </div>
              </div>
            )}

            {/* Meds / Diagnosis toggle */}
            <div className="pv-right-toggle">
              {['meds', 'diagnosis'].map(t => (
                <button
                  key={t}
                  onClick={() => setRightTab(t)}
                  className={`pv-toggle-btn${rightTab === t ? ' active' : ''}`}
                >
                  {t === 'meds' ? 'Meds' : 'Diagnosis'}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ══ Calendar strip ═══════════════════════ */}
        <div className="pv-cal">
          <div className="pv-cal-head">
            <button
              className="pv-cal-nav"
              onClick={() => setWeekOffset(o => o - 1)}
              aria-label="Previous week"
            >
              <img src={chevronL} alt="" className="pv-arrow-icon" />
            </button>
            <h2 className="pv-cal-month">
              <strong>
                {weekDates[0]?.toLocaleDateString('en-US', { month: 'long' })},
              </strong>
              {' '}
              <span>{weekDates[0]?.getFullYear()}</span>
            </h2>
            <button
              className="pv-cal-nav"
              onClick={() => setWeekOffset(o => o + 1)}
              aria-label="Next week"
            >
              <img src={chevronR} alt="" className="pv-arrow-icon" />
            </button>
          </div>

          {/* Day names header */}
          <div className="pv-cal-dnames">
            {DAY_NAMES.map(d => (
              <div key={d} className="pv-cal-dname">{d}</div>
            ))}
          </div>

          {/* Day tiles */}
          <div className="pv-cal-grid">
            {weekDates.map((date, i) => {
              const appts = getByDate(date)
              const today = isToday(date)
              return (
                <div
                  key={i}
                  className={`pv-cal-cell${today ? ' today' : ''}`}
                >
                  <div className="pv-cell-top-row">
                    {appts.length > 0 && (
                      <span className="pv-cell-time">
                        {fmtTime(appts[0].appointmentDate)}
                      </span>
                    )}
                  </div>

                  <span className="pv-cell-num">{date.getDate()}</span>

                  {appts.length > 0 && (
                    <p className="pv-cell-ev">
                      {appts[0].type || 'Appointment'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}