import { useEffect, useState } from 'react'
import { auth, db } from '../../services/firebase'
import { doc, getDoc } from 'firebase/firestore'
import './AdminOverview.css'

export default function AdminOverview() {
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

  const firstName = userData?.firstName || 'Admin'

  return (
    <div className="admin-overview">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Welcome back, {firstName} • System Overview</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            📊 Export Report
          </button>
          <button className="btn btn-primary">
            ⚙️ System Settings
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
            <p className="stat-label">Total Patients</p>
            <h3 className="stat-value">1,247</h3>
            <p className="stat-change positive">+8.2% this month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
            👨‍⚕️
          </div>
          <div className="stat-content">
            <p className="stat-label">Active Staff</p>
            <h3 className="stat-value">48</h3>
            <p className="stat-change">32 doctors, 16 nurses</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(45, 156, 156, 0.1)', color: 'var(--secondary)' }}>
            📅
          </div>
          <div className="stat-content">
            <p className="stat-label">Appointments Today</p>
            <h3 className="stat-value">156</h3>
            <p className="stat-change">82% completion rate</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            ⏱️
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg. Wait Time</p>
            <h3 className="stat-value">28 min</h3>
            <p className="stat-change positive">-12% from last week</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* System Alerts */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">System Alerts</h2>
            <button className="btn-text">View All</button>
          </div>
          <div className="schedule-list">
            <div className="schedule-item">
              <div className="schedule-time">Critical</div>
              <div className="schedule-details">
                <p className="schedule-patient">Server Capacity</p>
                <p className="schedule-type">Storage at 85% capacity</p>
              </div>
              <span className="badge badge-error">Action Required</span>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">Warning</div>
              <div className="schedule-details">
                <p className="schedule-patient">Queue Backup</p>
                <p className="schedule-type">Emergency dept - 12 patients waiting</p>
              </div>
              <span className="badge badge-warning">Monitor</span>
            </div>
            <div className="schedule-item">
              <div className="schedule-time">Info</div>
              <div className="schedule-details">
                <p className="schedule-patient">System Update</p>
                <p className="schedule-type">Scheduled maintenance: Mar 29</p>
              </div>
              <span className="badge badge-info">Scheduled</span>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Department Performance</h2>
            <button className="btn-text">View Details</button>
          </div>
          <div className="patient-list">
            <div className="patient-item">
              <div className="patient-avatar" style={{ background: 'var(--success)' }}>ER</div>
              <div className="patient-info">
                <p className="patient-name">Emergency</p>
                <p className="patient-detail">92% efficiency • 24 patients today</p>
              </div>
              <span className="badge badge-success">Excellent</span>
            </div>
            <div className="patient-item">
              <div className="patient-avatar" style={{ background: 'var(--info)' }}>IM</div>
              <div className="patient-info">
                <p className="patient-name">Internal Medicine</p>
                <p className="patient-detail">88% efficiency • 45 patients today</p>
              </div>
              <span className="badge badge-success">Good</span>
            </div>
            <div className="patient-item">
              <div className="patient-avatar" style={{ background: 'var(--warning)' }}>PD</div>
              <div className="patient-info">
                <p className="patient-name">Pediatrics</p>
                <p className="patient-detail">75% efficiency • 31 patients today</p>
              </div>
              <span className="badge badge-warning">Below Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="content-card" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card-header">
          <h2 className="card-title">Financial Overview (This Month)</h2>
          <button className="btn-text">Full Report</button>
        </div>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Revenue</p>
            <p style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--success)', margin: 0 }}>$248,500</p>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--success)', margin: 'var(--space-1) 0 0' }}>+12.5% vs last month</p>
          </div>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Expenses</p>
            <p style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>$182,300</p>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: 'var(--space-1) 0 0' }}>+2.1% vs last month</p>
          </div>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Net Profit</p>
            <p style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--success)', margin: 0 }}>$66,200</p>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--success)', margin: 'var(--space-1) 0 0' }}>+18.4% vs last month</p>
          </div>
          <div style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: '0 0 var(--space-2)' }}>Collections</p>
            <p style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--info)', margin: 0 }}>94.2%</p>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--success)', margin: 'var(--space-1) 0 0' }}>+1.8% vs last month</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="quick-actions-title">Admin Tools</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <span className="quick-action-icon">👥</span>
            <span>Manage Users</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📊</span>
            <span>View Analytics</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">📄</span>
            <span>Generate Report</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">⚙️</span>
            <span>System Settings</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">🔔</span>
            <span>Notifications</span>
          </button>
          <button className="quick-action-btn">
            <span className="quick-action-icon">🔒</span>
            <span>Security</span>
          </button>
        </div>
      </div>
    </div>
  )
}
