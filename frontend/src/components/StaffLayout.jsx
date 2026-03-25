import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import { signOut } from 'firebase/auth'
import './StaffLayout.css'

export default function StaffLayout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navItems = [
    { to: '/staff/home', label: 'Dashboard', icon: '🏠' },
    { to: '/staff/patients', label: 'Patients', icon: '👥' },
    { to: '/staff/messaging', label: 'Messages', icon: '💬' },
    { to: '/staff/calendar', label: 'Calendar', icon: '📅' },
    { to: '/staff/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/staff/profile', label: 'Profile', icon: '👤' },
    { to: '/staff/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">+</div>
            <h1 className="logo-text">Medic</h1>
          </div>
          <p className="sidebar-subtitle">Staff Portal</p>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                isActive ? 'nav-item nav-item-active' : 'nav-item'
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
