import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import './PatientCalendar.css'

import search from '../../assets/icons/search.png';
import trash from '../../assets/icons/trash.png';
import tick from '../../assets/icons/tick.png';
import edit from '../../assets/icons/edit.png';

const NAV_ITEMS = [
  {
    label: 'Hide Events',
  },
  {
    label: 'Show Events',
  },
]

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [currentDate])

  const loadAppointments = async () => {
    try {
      const apptQuery = query(collection(db, 'appointments'))
      const snapshot = await getDocs(apptQuery)
      const appts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAppointments(appts)
      setLoading(false)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setLoading(false)
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getAppointmentsForDate = (date) => {
    if (!date) return []
    return appointments.filter(appt => {
      const apptDate = appt.appointmentDate?.toDate()
      return apptDate && 
        apptDate.getDate() === date.getDate() &&
        apptDate.getMonth() === date.getMonth() &&
        apptDate.getFullYear() === date.getFullYear()
    })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const days = getDaysInMonth(currentDate)
  const selectedAppts = selectedDate ? getAppointmentsForDate(selectedDate) : []

  if (loading) {
    return (
      <div className="calendar loading">
        <div className="loading-spinner">Loading calendar...</div>
      </div>
    )
  }

  return (
    <>
      <div className="dates">
        <div className="dates-container">
          <header className="dates-header">
            <h2 className="dates-title">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>

            <div className="dates-nav">
              <button 
                className="btn-icon" 
                onClick={goToPreviousMonth}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              <button 
                className="btn-icon" 
                onClick={goToNextMonth}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </header>

          <div className="dates-grid">
            {dayNames.map(day => (
              <div key={day} className="dates-date-name">{day}</div>
            ))}
            
            {days.map((date, index) => {
              const dayAppts = date ? getAppointmentsForDate(date) : []
              return (
                <div
                  key={index}
                  className={`dates-date ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${selectedDate && date && selectedDate.toDateString() === date.toDateString() ? 'selected' : ''}`}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {date && (
                    <>
                      <span className="date-number">{date.getDate()}</span>
                      {dayAppts.length > 0 && (
                        <div className="date-appointments">
                          {dayAppts.slice(0, 2).map((appt, i) => (
                            <div key={i} className="appt-dot" style={{ background: appt.status === 'confirmed' ? '#3B82F6' : '#F59E0B' }} />
                          ))}
                          {dayAppts.length > 2 && <span className="appt-more">+{dayAppts.length - 2}</span>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="dates-search">
          <div className="date-search">
            <div className="search">
              <img 
                src={search}
                className="search-img"
              />

              <p className="search-text">Search</p>
            </div>

            <div className="search-list">
              <div className="list-item">
                <div className="list-body">
                  <p className="list-text">You have an appointment with Dr. Coy</p>
                  <p className="list-subtext">Lorem ipsum dor sit amet</p>
                </div>

                <div className="list-imgs">
                  <div className="list-img" style={{background: "#2cb337"}}>
                    <img 
                      src={tick}
                      className="tick-img"
                    />
                  </div>

                  <div className="list-img" style={{background: "#be2828"}}>
                    <img 
                      src={trash}
                      className="delete-img"
                    />
                  </div>
                </div>

                <div className="list-edit">
                  <div className="edit">
                    <img 
                      src={edit}
                      className="edit-img"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="nav-menu">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-area ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </>
  )
}