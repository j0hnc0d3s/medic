import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  reportService, 
  appointmentService, 
  patientService,
  staffService,
  notificationService 
} from '../../services'

import '../styles/AdminView.css'

export default function AdminOverview() {
  const { userProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    todayAppointments: [],
    upcomingBirthdays: [],
    staffOnDuty: [],
    stats: {
      totalPatients: 0,
      appointmentsToday: 0,
      monthlyIncome: 0,
      activeStaff: 0
    },
    recentAlerts: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get comprehensive dashboard summary
      const summaryResult = await reportService.getDashboardSummary()
      
      // Get today's appointments
      const todayAppts = await appointmentService.getTodayAppointments()
      
      // Get upcoming birthdays (mock for now - you'd filter patients by birthday)
      const patientsResult = await patientService.getPatients({ limit: 100 })
      const upcomingBirthdays = getUpcomingBirthdays(patientsResult.success ? patientsResult.patients : [])
      
      // Get staff on duty (active status)
      const staffResult = await staffService.getAllStaff({ status: 'active' })
      const staffOnDuty = staffResult.success ? staffResult.staff.slice(0, 5) : []
      
      // Get unread alerts/notifications
      const alertsResult = await notificationService.getNotifications({ 
        type: 'alert', 
        read: false,
        limit: 3 
      })

      if (summaryResult.success) {
        setDashboardData({
          todayAppointments: todayAppts.success ? todayAppts.appointments : [],
          upcomingBirthdays,
          staffOnDuty,
          stats: {
            totalPatients: summaryResult.summary.patients?.total || 0,
            appointmentsToday: summaryResult.summary.appointments?.today || 0,
            monthlyIncome: summaryResult.summary.finances?.totalIncome || 0,
            activeStaff: summaryResult.summary.staff?.active || 0
          },
          recentAlerts: alertsResult.success ? alertsResult.notifications : []
        })
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  const getUpcomingBirthdays = (patients) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset to start of day
    
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const birthdays = patients
      .filter(patient => patient.dateOfBirth) // Must have DOB
      .map(patient => {
        const dob = patient.dateOfBirth.toDate ? patient.dateOfBirth.toDate() : new Date(patient.dateOfBirth)
        
        // Get this year's birthday
        let birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        birthdayThisYear.setHours(0, 0, 0, 0)
        
        // If birthday already passed this year, use next year
        let nextBirthday = birthdayThisYear
        if (birthdayThisYear < today) {
          nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
          nextBirthday.setHours(0, 0, 0, 0)
        }
        
        // Calculate days until birthday
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24))
        
        return {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          nextBirthday,
          daysUntil,
          dateFormatted: daysUntil === 0 ? 'Today' : 
                        daysUntil === 1 ? 'Tomorrow' : 
                        nextBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      })
      .filter(item => item.daysUntil <= 30) // Next 30 days
      .sort((a, b) => a.daysUntil - b.daysUntil) // Sort by closest first
      .slice(0, 5) // Show max 5

    return birthdays
  }

  const getInitials = (name) => {
    const parts = name.split(' ')
    return parts.map(p => p[0]).join('').toUpperCase()
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      'scheduled': 'pending',
      'confirmed': 'pending',
      'in-progress': 'in-progress',
      'completed': 'completed'
    }
    return classes[status] || 'pending'
  }

  const formatTime = (time) => {
    if (!time) return ''
    return time
  }

  const getStaffShiftBadge = (shift, status) => {
    if (status === 'on-break') return { text: 'Break', class: 'break' }
    if (status === 'off-duty') return { text: 'Off Duty', class: 'pending' }
    if (status === 'on-leave') return { text: 'On Leave', class: 'pending' }
    
    // Active staff - show shift
    const shiftBadges = {
      'day': { text: 'Day Shift', class: 'in-progress' },
      'night': { text: 'Night Shift', class: 'in-progress' },
      'evening': { text: 'Evening', class: 'in-progress' }
    }
    return shiftBadges[shift] || { text: 'Active', class: 'in-progress' }
  }

  const getStaffShiftTime = (shift) => {
    const shiftTimes = {
      'day': '8:00 AM - 4:00 PM',
      'evening': '4:00 PM - 12:00 AM',
      'night': '12:00 AM - 8:00 AM'
    }
    return shiftTimes[shift] || 'Flexible'
  }

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  const firstName = userProfile?.firstName || 'Admin'

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar-left">
        {/* Today's Appointments */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Today's Appointments</h2>
            <span className="card-badge">{dashboardData.todayAppointments.length}</span>
          </div>

          <div className="appointments-list">
            {dashboardData.todayAppointments.slice(0, 3).map((appt, index) => (
              <div key={appt.id} className="appointment-item">
                <div className="appointment-avatar" style={{ 
                  background: ['#2D9C9C', '#FF6B6B', '#1F4788', '#F59E0B'][index % 4]
                }}>
                  {getInitials(appt.patientName)}
                </div>
                <div className="appointment-info">
                  <p className="appointment-name">{appt.patientName}</p>
                  <p className="appointment-time">{formatTime(appt.appointmentTime)} • {appt.type}</p>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(appt.status)}`}>
                  {appt.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </div>
            ))}

            {dashboardData.todayAppointments.length === 0 && (
              <div className="empty-state-small">
                <p>No appointments today</p>
              </div>
            )}
          </div>

          <button className="card-link" onClick={() => navigate('/admin/appointments')}>
            View all appointments →
          </button>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Quick Stats</h2>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{dashboardData.stats.totalPatients}</div>
              <div className="stat-label">Total Patients</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">${dashboardData.stats.monthlyIncome.toFixed(0)}</div>
              <div className="stat-label">Income (Month)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-sidebar-right">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome back, {firstName}!</h1>
            <p className="dashboard-subtitle">Here's what's happening at your clinic today</p>
          </div>

          <button 
            className="btn-primary"
            onClick={() => navigate('/admin/addpatient')}
          >
            + Add Patient
          </button>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-column">
            {/* Clinic Overview */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">Clinic Overview</h2>
              </div>

              <div className="overview-stats">
                <div className="overview-stat">
                  <div className="overview-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="overview-info">
                    <div className="overview-value">{dashboardData.stats.totalPatients}</div>
                    <div className="overview-label">Total Patients</div>
                  </div>
                </div>

                <div className="overview-stat">
                  <div className="overview-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="overview-info">
                    <div className="overview-value">{dashboardData.stats.appointmentsToday}</div>
                    <div className="overview-label">Appointments Today</div>
                  </div>
                </div>

                <div className="overview-stat">
                  <div className="overview-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="overview-info">
                    <div className="overview-value">${dashboardData.stats.monthlyIncome.toFixed(0)}</div>
                    <div className="overview-label">Monthly Income</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff On Duty */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">Staff On Duty</h2>
                <span className="card-badge">{dashboardData.staffOnDuty.length}</span>
              </div>

              <div className="staff-list">
                {dashboardData.staffOnDuty.length > 0 ? (
                  dashboardData.staffOnDuty.map((staff, index) => {
                    const shiftBadge = getStaffShiftBadge(staff.shift, staff.status)
                    return (
                      <div key={staff.id} className="staff-item">
                        <div className="staff-avatar" style={{ 
                          background: ['#6B7280', '#1F4788', '#2D9C9C', '#8B5CF6', '#F59E0B'][index % 5]
                        }}>
                          {getInitials(staff.fullName || `${staff.firstName} ${staff.lastName}`)}
                        </div>
                        <div className="staff-info">
                          <p className="staff-name">
                            {staff.role === 'Doctor' ? 'Dr. ' : ''}{staff.fullName || `${staff.firstName} ${staff.lastName}`}
                          </p>
                          <p className="staff-detail">
                            {staff.department || staff.specialization || staff.role} • {getStaffShiftTime(staff.shift)}
                          </p>
                        </div>
                        <span className={`status-badge ${shiftBadge.class}`}>
                          {shiftBadge.text}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="empty-state-small">
                    <p>No staff on duty</p>
                  </div>
                )}
              </div>

              <button className="card-link" onClick={() => navigate('/admin/staff/calendar')}>
                View staff calendar →
              </button>
            </div>
          </div>

          <div className="dashboard-column">
            {/* Upcoming Birthdays */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">Upcoming Birthdays</h2>
                {dashboardData.upcomingBirthdays.length > 0 && (
                  <span className="card-badge">{dashboardData.upcomingBirthdays.length}</span>
                )}
              </div>

              <div className="birthday-list">
                {dashboardData.upcomingBirthdays.length > 0 ? (
                  dashboardData.upcomingBirthdays.map((birthday) => (
                    <div 
                      key={birthday.id} 
                      className={`birthday-item clickable ${birthday.daysUntil === 0 ? 'today' : ''}`}
                      onClick={() => navigate(`/admin/patients/${birthday.id}`)}
                      title="Click to view patient"
                    >
                      <span className="birthday-icon">🎂</span>
                      <div className="birthday-info">
                        <div className="birthday-name">{birthday.name}</div>
                        <div className="birthday-date">
                          {birthday.dateFormatted}
                          {birthday.daysUntil > 0 && (
                            <span className="birthday-countdown"> • in {birthday.daysUntil} day{birthday.daysUntil !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-small">
                    <p>No birthdays in the next 30 days</p>
                  </div>
                )}
              </div>

              <button className="card-link" onClick={() => navigate('/admin/patients')}>
                View all patients →
              </button>
            </div>

            {/* System Alerts */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">System Alerts</h2>
                <span className="card-badge alert">{dashboardData.recentAlerts.length}</span>
              </div>

              <div className="alerts-list">
                {dashboardData.recentAlerts.length > 0 ? (
                  dashboardData.recentAlerts.map((alert) => (
                    <div key={alert.id} className="alert-item critical">
                      <div className="alert-dot"></div>
                      <div className="alert-content">
                        <p className="alert-title">{alert.title}</p>
                        <p className="alert-text">{alert.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="alert-item info">
                    <div className="alert-dot"></div>
                    <div className="alert-content">
                      <p className="alert-title">All Clear</p>
                      <p className="alert-text">No system alerts</p>
                    </div>
                  </div>
                )}
              </div>

              <button className="card-link" onClick={() => navigate('/admin/notifications')}>
                View all alerts →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}