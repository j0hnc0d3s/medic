import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import './PatientCalendar.css'

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
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
    <div className="calendar">
      <div className="calendar-container">
        <header className="calendar-header">
          <h1 className="calendar-title">Calendar</h1>
          <div className="calendar-nav">
            <button className="btn btn-secondary" onClick={goToToday}>Today</button>
            <button className="btn-icon" onClick={goToPreviousMonth}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 className="calendar-month">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button className="btn-icon" onClick={goToNextMonth}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-name">{day}</div>
          ))}
          
          {days.map((date, index) => {
            const dayAppts = date ? getAppointmentsForDate(date) : []
            return (
              <div
                key={index}
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${selectedDate && date && selectedDate.toDateString() === date.toDateString() ? 'selected' : ''}`}
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <>
                    <span className="day-number">{date.getDate()}</span>
                    {dayAppts.length > 0 && (
                      <div className="day-appointments">
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

        {selectedDate && (
          <div className="calendar-sidebar">
            <h3 className="sidebar-title">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            {selectedAppts.length > 0 ? (
              <div className="sidebar-appointments">
                {selectedAppts.map(appt => (
                  <div key={appt.id} className="sidebar-appt">
                    <div className="appt-time">{appt.appointmentTime}</div>
                    <div className="appt-details">
                      <div className="appt-patient">{appt.patientName}</div>
                      <div className="appt-type">{appt.type}</div>
                    </div>
                    <div className={`appt-status ${appt.status}`}>{appt.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-appointments">No appointments scheduled</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}