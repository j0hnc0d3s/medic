// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/StaffCalendar.jsx
// CSS  : src/pages/styles/Calendar.css  (shared)
// ─────────────────────────────────────────────────────────
import { useState, useNavigate, useEffect } from 'react'
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../../services/firebase'
import '../styles/Calendar.css'

import searchImg from '../../assets/images/search.png'
import tickImg   from '../../assets/images/tick.png'
import trashImg  from '../../assets/images/trash.png'
import editImg   from '../../assets/images/edit.png'
import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'


const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']

const isToday = date =>
  date &&
  date.getDate()     === new Date().getDate()     &&
  date.getMonth()    === new Date().getMonth()    &&
  date.getFullYear() === new Date().getFullYear()

const STAFF_NAV = [
  { img: homeImg, path: '/staff/overview', title: 'Home', active: false },
  { img: phoneImg, path: '/staff/messaging', title: 'Messaging', active: false },
  { img: clockImg, path: '/staff/appointments', title: 'Appointments', active: false },
  { img: schedImg, path: '/staff/calendar', title: 'Calendar', active: true },
]

export default function StaffCalendar() {
  const navigate = useNavigate()
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [showEvents,   setShowEvents]   = useState(true)

  useEffect(() => { loadAppointments() }, [currentDate])

  const loadAppointments = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'appointments')))
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const getDaysInMonth = date => {
    const year  = date.getFullYear()
    const month = date.getMonth()
    const first = new Date(year, month, 1).getDay()
    const last  = new Date(year, month + 1, 0).getDate()
    const days  = []
    for (let i = 0; i < first; i++) days.push(null)
    for (let i = 1; i <= last; i++) days.push(new Date(year, month, i))
    return days
  }

  const getApptsForDate = date => {
    if (!date) return []
    return appointments.filter(a => {
      const d = a.appointmentDate?.toDate()
      return d &&
        d.getDate()     === date.getDate()     &&
        d.getMonth()    === date.getMonth()    &&
        d.getFullYear() === date.getFullYear()
    })
  }

  const days        = getDaysInMonth(currentDate)
  const panelAppts  = selectedDate ? getApptsForDate(selectedDate) : appointments.slice(0, 6)

  if (loading) return (
    <div className="cal-shell">
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

      <div className="cal-loading"><div className="cal-spinner" /></div>
    </div>
  )

  return (
    <div className="cal-shell">
      <div className="cal-page">
        <div className="cal-layout">

          {/* ── Calendar grid ──────────────────── */}
          <div className="cal-main">
            <div className="cal-head">
              <div className="cal-month-content">
                <h1 className="cal-month-title">
                  <strong>{MONTH_NAMES[currentDate.getMonth()]}</strong>{' '}
                  <span>{currentDate.getFullYear()}</span>
                </h1>
              </div>

              <div className="cal-head-right">
                <button className="cal-toggle-pill"
                  onClick={() => setShowEvents(s => !s)}>
                  {showEvents ? 'Hide Events' : 'Show Events'}
                </button>

                <div className="cal-nav-btns">
                  <button className="cal-nav-btn"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    aria-label="Previous month">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <button className="cal-nav-btn"
                    onClick={() => setCurrentDate(new Date())}
                    aria-label="Today">
                    Today
                  </button>
                  <button className="cal-nav-btn"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    aria-label="Next month">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="cal-day-names">
              {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
            </div>

            <div className="cal-grid">
              {days.map((date, i) => {
                const dayAppts = date ? getApptsForDate(date) : []
                const today    = isToday(date)
                const selected = selectedDate && date &&
                  selectedDate.toDateString() === date.toDateString()

                return (
                  <div key={i}
                    className={`cal-cell${!date ? ' empty' : ''}${today ? ' today' : ''}${selected ? ' selected' : ''}`}
                    onClick={() => date && setSelectedDate(date)}>
                    {date && (<>
                      <span className="cal-cell-num">{date.getDate()}</span>
                      {showEvents && dayAppts.length > 0 && (
                        <div className="cal-cell-dots">
                          {dayAppts.slice(0, 2).map((a, j) => (
                            <div key={j} className="cal-dot"
                              style={{ background: a.status === 'confirmed' ? '#3B82F6' : '#F59E0B' }} />
                          ))}
                          {dayAppts.length > 2 && (
                            <span className="cal-dot-more">+{dayAppts.length - 2}</span>
                          )}
                        </div>
                      )}
                    </>)}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Events panel ───────────────────── */}
          <div className="cal-panel">
            <div className="cal-search">
              <img src={searchImg} alt="" className="cal-search-icon" />
              <span className="cal-search-text">Search</span>
            </div>

            <div className="cal-events-list">
              {panelAppts.map((appt, i) => (
                <div key={appt.id || i} className="cal-event-item">
                  <div className="cal-event-body">
                    <p className="cal-event-title">
                      {appt.patientName ? `Appt — ${appt.patientName}` : appt.type || 'Appointment'}
                    </p>
                    <p className="cal-event-sub">
                      {appt.appointmentTime || 'Time TBD'}
                      {appt.doctor ? ` · ${appt.doctor}` : ''}
                    </p>
                  </div>

                  <div className="cal-event-actions">
                    <button className="cal-event-btn confirm" aria-label="Confirm">
                      <img src={tickImg}  alt="" className="cal-event-icon" />
                    </button>
                    <button className="cal-event-btn delete" aria-label="Delete">
                      <img src={trashImg} alt="" className="cal-event-icon" />
                    </button>
                  </div>

                  <button className="cal-event-edit" aria-label="Edit">
                    <img src={editImg} alt="" className="cal-event-edit-icon" />
                  </button>
                </div>
              ))}

              {panelAppts.length === 0 && (
                <p className="cal-events-empty">
                  {selectedDate ? 'No events on this day' : 'No upcoming appointments'}
                </p>
              )}

              {!selectedDate && (
                <p className="cal-events-hint">Select a date to filter events</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
