// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminSidebar.jsx
// CSS  : src/pages/staff/NurseSidebar.css (shared — same .ns-* classes)
//
// Admin's own nav, not a repurposed NurseSidebar: Overview,
// Finances, Messaging, Patients, Notifications, with Settings +
// Logout in the footer — deliberately no Appointments/Notes/
// Documents/Imaging/Labs, since those are clinical-workflow pages
// admin doesn't operate day-to-day.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import notificationService from '../../services/notificationService'
import '../staff/NurseSidebar.css'

import settings from '../../assets/inverted/settings.png'
import logout from '../../assets/inverted/logout.png'

const NAV_ITEMS = [
  { key: 'overview',      label: 'Overview',      path: '/admin/overview',      icon: 'home'  },
  { key: 'finances',      label: 'Finances',      path: '/admin/finances',      icon: 'finance' },
  { key: 'patients',      label: 'Patients',      path: '/admin/patients',      icon: 'user'  },
  { key: 'messaging',     label: 'Messaging',     path: '/admin/messaging',     icon: 'send'  },
]

const ICONS = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  finance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  send: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
}

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const refresh = () => {
      notificationService.getUnreadCount(uid).then(res => {
        if (res.success) setUnreadCount(res.count)
      })
    }
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try { await signOut(auth) } catch (err) { console.error('Logout error:', err) }
    finally { navigate('/login') }
  }

  const activeKey = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.key
    || (location.pathname.startsWith('/admin/notifications') ? 'notifications' : 'overview')

  return (
    <div className="ns-shell">
      <div className="ns-patients" style={{ flex: 'none', minHeight: 60 }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, padding: '20px 16px 0' }}>Admin</p>
      </div>

      <div className="ns-nav" style={{ flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.key}
            className={`ns-nav-item${activeKey === item.key ? ' active' : ''}`}
            onClick={() => navigate(item.path)}>
            <div className={`ns-nav-icon${activeKey === item.key ? ' active' : ''}`}>
              {ICONS[item.icon]}
            </div>
            <span className="ns-nav-label">{item.label}</span>
          </button>
        ))}

        <div className="ns-nav-spacer" />

        <div className="ns-nav-footer">
          <button className="ns-icon-btn ns-icon-btn--badge" onClick={() => navigate('/admin/notifications')} aria-label="Notifications">
            {ICONS.bell}
            {unreadCount > 0 && <span className="ns-nav-badge" />}
          </button>

          <button className="ns-icon-btn" onClick={() => navigate('/admin/settings')} aria-label="Settings">
            <img src={settings} className="ns-alt-icon"/>
          </button>

          <button className="ns-icon-btn" onClick={handleLogout} aria-label="Log out">
            <img src={logout} className="ns-other-icon"/>
          </button>
        </div>
      </div>
    </div>
  )
}
