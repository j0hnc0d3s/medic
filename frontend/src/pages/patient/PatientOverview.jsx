import { useEffect, useState } from 'react'
import { auth, db } from '../../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import './PatientOverview.css'

export default function PatientOverview() {
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

  const firstName = userData?.firstName || 'Patient'

  return (
    <div className="patient-overview">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Welcome, {firstName}!</h1>
          <p className="page-subtitle">Your Health Dashboard</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            📅 Book Appointment
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            📅
          </div>
          <div className="stat-content">
            <p className="stat-label">Next Appointment</p>
            <h3 className="stat-value" style={{ fontSize: '1.5rem' }}>Mar 28</h3>
            <p className="stat-change">9:00 AM with Dr. Smith</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
            💊
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Medications</p>
            <h3 className="stat-value">3</h3>
            <p className="stat-change">2 due for refill</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            🔬
          </div>
          <div className="stat-content">
            <p className="stat-label">Lab Results</p>
            <h3 className="stat-value">2</h3>
            <p className="stat-change">New results available</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(45, 156, 156, 0.1)', color: 'var(--secondary)' }}>
            📄
          </div>
          <div className="stat-content">
            <p className="stat-label">Medical Records</p>
            <h3 className="stat-value">12</h3>
            <p className="stat-change">View all documents</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Upcoming Appointments */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Upcoming Appointments</h2>
            <button className="btn-text">View All</button>
          </div>
          <div className="schedule-list">
            <div className="schedule-item">
              <div className="schedule-time">Mar 28</div>
              <div className="schedule-details">
                <p className="schedule-patient">Dr. Emily Smith</p>
                <p className="schedule-type">Annual Checkup - 9:00 AM</p>
              </div>
              <span className="badge badge-success">Confirmed</span>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">Apr 5</div>
              <div className="schedule-details">
                <p className="schedule-patient">Dr. Michael Johnson</p>
                <p className="schedule-type">Follow-up - 2:30 PM</p>
              </div>
              <span className="badge badge-info">Scheduled</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
            <button className="btn-text">View All</button>
          </div>
          <div className="patient-list">
            <div className="patient-item">
              <div className="patient-avatar" style={{ background: 'var(--success)' }}>✓</div>
              <div className="patient-info">
                <p className="patient-name">Lab Results Ready</p>
                <p className="patient-detail">Blood work - 2 days ago</p>
              </div>
            </div>
            <div className="patient-item">
              <div className="patient-avatar" style={{ background: 'var(--info)' }}>💬</div>
              <div className="patient-info">
                <p className="patient-name">New Message</p>
                <p className="patient-detail">Dr. Smith - 3 days ago</p>
              </div>
            </div>
            <div className="patient-item">
              <div className="patient-avatar" style={{ background: 'var(--warning)' }}>💊</div>
              <div className="patient-info">
                <p className="patient-name">Prescription Refill</p>
                <p className="patient-detail">Due in 5 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Summary Card */}
      <div className="content-card" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card-header">
          <h2 className="card-title">Health Summary</h2>
          <button className="btn-text">Update</button>
        </div>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Blood Type</p>
            <p style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>O+</p>
          </div>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Height</p>
            <p style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>175 cm</p>
          </div>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Weight</p>
            <p style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>72 kg</p>
          </div>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Allergies</p>
            <p style={{ fontSize: 'var(--font-xl)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Peanuts</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="quick-actions-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <span className="quick-action-icon">📅</span>
            <span>Book Appointment</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">💬</span>
            <span>Message Doctor</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">💊</span>
            <span>Refill Prescription</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📄</span>
            <span>View Records</span>
          </button>
        </div>
      </div>
    </div>
  )
}
