import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './AdminDashboard.css'

export default function AdminOverview() {
  const { userProfile, loading } = useAuth()

  if (loading) {
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
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Today's Appointments</h2>
            <span className="card-badge">12</span>
          </div>

          <div className="appointments-list">
            <div className="appointment-item">
              <div className="appointment-avatar" style={{ background: '#2D9C9C' }}>
                JS
              </div>
              <div className="appointment-info">
                <p className="appointment-name">John Smith</p>
                <p className="appointment-time">9:00 AM • General Checkup</p>
              </div>
              <span className="status-badge pending">Pending</span>
            </div>

            <div className="appointment-item">
              <div className="appointment-avatar" style={{ background: '#FF6B6B' }}>
                MJ
              </div>
              <div className="appointment-info">
                <p className="appointment-name">Mary Johnson</p>
                <p className="appointment-time">10:30 AM • Follow-up</p>
              </div>
              <span className="status-badge in-progress">In Progress</span>
            </div>

            <div className="appointment-item">
              <div className="appointment-avatar" style={{ background: '#1F4788' }}>
                RB
              </div>
              <div className="appointment-info">
                <p className="appointment-name">Robert Brown</p>
                <p className="appointment-time">2:00 PM • Emergency</p>
              </div>
              <span className="status-badge pending">Pending</span>
            </div>
          </div>

          <button className="card-link">View all appointments →</button>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Quick Stats</h2>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">47</div>
              <div className="stat-label">Patients This Week</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">$12,450</div>
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

          <button className="btn-primary">
            + Add Patient
          </button>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-column">
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
                    <div className="overview-value">156</div>
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
                    <div className="overview-value">24</div>
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
                    <div className="overview-value">$4,250</div>
                    <div className="overview-label">Net Profit (Month)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">Staff On Duty</h2>
                <span className="card-badge">8</span>
              </div>

              <div className="staff-list">
                <div className="staff-item">
                  <div className="staff-avatar" style={{ background: '#6B7280' }}>
                    JW
                  </div>
                  <div className="staff-info">
                    <p className="staff-name">Dr. James Wilson</p>
                    <p className="staff-detail">Internal Medicine</p>
                  </div>
                  <span className="status-badge break">Break</span>
                </div>
              </div>

              <button className="card-link">View all staff →</button>
            </div>
          </div>

          <div className="dashboard-column">
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">Upcoming Birthdays</h2>
              </div>

              <div className="birthday-list">
                <div className="birthday-item">
                  <span className="birthday-icon">🎂</span>
                  <div className="birthday-info">
                    <div className="birthday-name">John Smith</div>
                    <div className="birthday-date">Tomorrow</div>
                  </div>
                </div>

                <div className="birthday-item">
                  <span className="birthday-icon">🎂</span>
                  <div className="birthday-info">
                    <div className="birthday-name">Mary Johnson</div>
                    <div className="birthday-date">April 2</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">System Alerts</h2>
                <span className="card-badge alert">3</span>
              </div>

              <div className="alerts-list">
                <div className="alert-item critical">
                  <div className="alert-dot"></div>
                  <div className="alert-content">
                    <p className="alert-title">Server Capacity</p>
                    <p className="alert-text">Storage at 85% capacity</p>
                  </div>
                </div>

                <div className="alert-item warning">
                  <div className="alert-dot"></div>
                  <div className="alert-content">
                    <p className="alert-title">Queue Backup</p>
                    <p className="alert-text">Emergency dept - 12 patients</p>
                  </div>
                </div>

                <div className="alert-item info">
                  <div className="alert-dot"></div>
                  <div className="alert-content">
                    <p className="alert-title">System Update</p>
                    <p className="alert-text">Scheduled: Mar 29</p>
                  </div>
                </div>
              </div>

              <button className="card-link">View all alerts →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}