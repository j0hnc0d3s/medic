import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'

import '../pages/styles/Layout.css'

import settings from '../assets/images/settings.png';
import notifications from '../assets/images/notifications.png';
import inverted from '../assets/images/inverted.png';

const NAV_ITEMS = [
  {
    path: '/patient/overview',
    label: 'Home',
    icon: (
      <></>
    ),
  },
  {
    path: '/patient/messaging',
    label: 'Messaging',
    icon: (
      <></>
    ),
  },
  {
    path: '/patient/appointments',
    label: 'Appointments',
    icon: (
      <></>
    ),
  },
  {
    path: '/patient/calendar',
    label: 'Calendar',
    icon: ( 
      <></>
    ),
  },
]

export default function PatientLayout() {
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

  const firstName = userProfile?.firstName || 'Patient'
  const lastName = userProfile?.lastName || ''
  const initials = firstName.charAt(0) + (lastName.charAt(0) || '')

  return (
    <div className="layout">
      <header className="top-nav">
        <div className="nav-brand">
          <div className="nav-logo">
            <img 
              src={inverted} 
              alt="Logo" 
              className="logo-img"
            />
          </div>

          <span className="brand-name">Medic</span>
        </div>

        <nav className="nav-items">
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
        </nav>

        <div className="nav-actions">
          <button             
            className="icon-btn"
            onClick={() => navigate('/patient/notifications')}
            title="Notifications"
          >
            <img 
              src={notifications} 
              alt="Notifications" 
              className="icon-img"
            />
          </button>

          <button             
            className="icon-btn"
            onClick={() => navigate('/patient/settings')}
            title="Notifications"
          >
            <img 
              src={settings} 
              alt="Settings" 
              className="icon-img"
            />
          </button>

          <div className="user-area">
            <button 
              className="user-icon"
              onClick={() => navigate('/patient/profile')}
              title="Patient Profile"
            >
              {initials}
            </button>

            <div className="user-info-expanded">
              <div className="user-info">
                <span className="user-name">{firstName}</span>
                <span className="user-role">Patient</span>
              </div>

              <button className="icon-btn-sm" onClick={handleLogout} title="Logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" 
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  )
}