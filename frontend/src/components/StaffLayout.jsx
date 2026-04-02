import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import './StaffLayout.css'

import settings from '../assets/icons/settings.png';
import notifications from '../assets/icons/notifications.png';
import activity from '../assets/icons/activity.png';
import logo from '../assets/images/logo.png';

const NAV_ITEMS = [
  {
    path: '/staff/overview',
    label: 'Overview',
    icon: (
      <></>
    ),
  },
  {
    path: '/staff/patients',
    label: 'Patients',
    icon: (
      <></>
    ),
  },
  {
    path: '/staff/messaging',
    label: 'Messaging',
    icon: (
      <></>
    ),
  },
  {
    path: '/staff/calendar',
    label: 'Calendar',
    icon: (
      <></>
    ),
  },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('userToken')
      localStorage.removeItem('userData')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const firstName = userProfile?.firstName || 'Staff'
  const lastName = userProfile?.lastName || ''
  const initials = firstName.charAt(0) + (lastName.charAt(0) || '')

  return (
    <div className="admin-layout">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        {/* Logo/Brand */}
        <div className="nav-brand">
          <div className="brand-logo">
            <img 
              src={logo} 
              alt="Logo" 
              className="logo-img"
            />
          </div>

          <span className="brand-name">Medic</span>
        </div>

        {/* Navigation Items */}
        <nav className="nav-items">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="nav-actions">
          <button             
            className="icon-btn"
            onClick={() => navigate('/staff/activities')}
            title="Activity"
          >
            <img 
              src={activity} 
              alt="Activity" 
              className="icon-img"
            />
          </button>

          <button             
            className="icon-btn"
            onClick={() => navigate('/staff/notifications')}
            title="Notifications"
          >
            <img 
              src={notifications} 
              alt="Notifications" 
              className="icon-img"
            />
          </button>


          <div className="user-menu">
            <div className="user-avatar">{initials}</div>
            
            <div className="user-info">
              <span className="user-name">{firstName}</span>
              <span className="user-role">Staff</span>
            </div>

            <button className="icon-btn-sm" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}