import { useEffect, useState } from 'react'
import { auth, db } from '../../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import './StaffOverview.css'

export default function StaffHome() {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            setUserData(userDoc.data())
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  const firstName = userData?.firstName || 'Staff'
  const department = userData?.department || 'General'
  const role = userData?.role || 'staff'

  return (
    <div className="staff-home">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Welcome back, Dr. {firstName}!</h1>
          <p className="page-subtitle">{department} Department • {role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            📊 View Reports
          </button>
          <button className="btn btn-primary">
            + New Appointment
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            👥
          </div>
          <div className="stat-content">
            <p className="stat-label">Patients Today</p>
            <h3 className="stat-value">24</h3>
            <p className="stat-change positive">+12% from yesterday</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
            📅
          </div>
          <div className="stat-content">
            <p className="stat-label">Appointments</p>
            <h3 className="stat-value">18</h3>
            <p className="stat-change">5 pending confirmation</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            ⏰
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg. Wait Time</p>
            <h3 className="stat-value">32 min</h3>
            <p className="stat-change negative">+5 min from last week</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
            🚨
          </div>
          <div className="stat-content">
            <p className="stat-label">Critical Cases</p>
            <h3 className="stat-value">3</h3>
            <p className="stat-change">Requires immediate attention</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Today's Schedule */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Today's Schedule</h2>
            <button className="btn-text">View All</button>
          </div>
          <div className="schedule-list">
            <div className="schedule-item">
              <div className="schedule-time">9:00 AM</div>
              <div className="schedule-details">
                <p className="schedule-patient">John Doe</p>
                <p className="schedule-type">Annual Checkup</p>
              </div>
              <span className="badge badge-success">Confirmed</span>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">10:30 AM</div>
              <div className="schedule-details">
                <p className="schedule-patient">Jane Smith</p>
                <p className="schedule-type">Follow-up Visit</p>
              </div>
              <span className="badge badge-warning">Waiting</span>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">2:00 PM</div>
              <div className="schedule-details">
                <p className="schedule-patient">Michael Brown</p>
                <p className="schedule-type">Consultation</p>
              </div>
              <span className="badge badge-info">Scheduled</span>
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Recent Patients</h2>
            <button className="btn-text">View All</button>
          </div>
          <div className="patient-list">
            <div className="patient-item">
              <div className="patient-avatar">JD</div>
              <div className="patient-info">
                <p className="patient-name">John Doe</p>
                <p className="patient-detail">Last visit: 2 days ago</p>
              </div>
            </div>
            <div className="patient-item">
              <div className="patient-avatar">JS</div>
              <div className="patient-info">
                <p className="patient-name">Jane Smith</p>
                <p className="patient-detail">Last visit: 1 week ago</p>
              </div>
            </div>
            <div className="patient-item">
              <div className="patient-avatar">MB</div>
              <div className="patient-info">
                <p className="patient-name">Michael Brown</p>
                <p className="patient-detail">Last visit: 2 weeks ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="quick-actions-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <span className="quick-action-icon">📋</span>
            <span>View Queue</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📝</span>
            <span>Write Prescription</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">🔬</span>
            <span>Order Lab Test</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📊</span>
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}
