import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'

import '../pages/styles/Layout.css'

import settings from '../assets/images/settings.png';
import notifications from '../assets/images/notifications.png';
import activity from '../assets/images/activity.png';
import logo from '../assets/images/logo.png';

const NAV_ITEMS = [
  {
    path: '/admin/overview',
    label: 'Overview',
    icon: (
      <></>
    ),
  },
  {
    path: '/admin/patients',
    label: 'Patients',
    icon: (
      <></>
    ),
  },
  {
    path: '/admin/finances',
    label: 'Finances',
    icon: (
      <></>
    ),
  },
  {
    path: '/admin/reports',
    label: 'Reports',
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

  const firstName = userProfile?.firstName || 'Admin'
  const lastName = userProfile?.lastName || ''
  const initials = firstName.charAt(0) + (lastName.charAt(0) || '')

  return (
    <div className="admin-layout">
      {/* Top Navigation Bar */}
      <header className="top-nav">
        {/* Logo/Brand */}
        <div className="nav-brand">
          <div className="nav-logo">
            <img 
              src={inverted} 
              alt="Logo" 
              className="logo-img"
            />
          </div>

          <div className="nav-content">
            <span className="brand-name">medic</span>
            <h3 className="brand-title">Takes care of you</h3>
          </div>
        </div>


        {/* Navigation Items */}

        {/* Right Side Actions */}
        <div className="nav-actions">

          <div className="user-menu">
            <div className="user-avatar">{initials}</div>
            
            <div className="user-info">
              <span className="user-name">{firstName}</span>
              <span className="user-role">Admin</span>
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