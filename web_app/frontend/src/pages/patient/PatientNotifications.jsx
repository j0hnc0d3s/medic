// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientNotifications.jsx
// CSS  : src/pages/staff/NurseNotifications.css (shared — same .nn-* classes)
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import notificationService from '../../services/notificationService'
import PatientSidebar from './PatientSidebar'
import '../staff/NurseNotifications.css'

const TYPE_LABELS = {
  message: 'Messages', appointment: 'Appointments', lab: 'Labs',
  system: 'System', alert: 'Alerts', birthday: 'Birthdays',
}

const FILTERS = ['all', 'unread', 'message', 'appointment', 'lab']

const formatDate = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d)) return '—'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const day = new Date(d); day.setHours(0, 0, 0, 0)
  if (day.getTime() === today.getTime()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PatientNotifications() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    if (!userProfile?.uid) return
    setLoading(true)
    try {
      const res = await notificationService.getNotifications({ userId: userProfile.uid, limit: 100 })
      if (res.success) setNotifications(res.notifications)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userProfile?.uid])

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications
    if (filter === 'unread') return notifications.filter(n => !n.read)
    return notifications.filter(n => n.type === filter)
  }, [notifications, filter])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleClick = async (n) => {
    if (!n.read) {
      await notificationService.markAsRead(n.id)
      setNotifications(list => list.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    if (n.actionUrl) navigate(n.actionUrl)
  }

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(userProfile.uid)
    setNotifications(list => list.map(n => ({ ...n, read: true })))
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    setNotifications(list => list.filter(n => n.id !== id))
    try { await notificationService.deleteNotification(id) } catch (err) { console.error('Delete failed:', err); load() }
  }

  return (
    <div className="no-shell">
      <PatientSidebar />

      <div className="no-main">
        <div className="nn-header">
          <h1 className="nn-title">Notifications</h1>
          {unreadCount > 0 && (
            <button className="nn-mark-all" onClick={handleMarkAllRead}>Mark all as read</button>
          )}
        </div>

        <div className="nn-filters">
          {FILTERS.map(f => (
            <button key={f}
              className={`nn-filter-pill${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : TYPE_LABELS[f] || f}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading notifications…</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '60px 0' }}>
            {filter === 'all' ? 'No notifications yet.' : 'Nothing here.'}
          </p>
        ) : (
          <div className="nn-list">
            {filtered.map(n => (
              <div key={n.id}
                className={`nn-item${n.read ? '' : ' unread'}`}
                onClick={() => handleClick(n)}>
                <div className="nn-item-dot-wrap">
                  {!n.read && <span className="nn-item-dot" />}
                </div>
                <div className="nn-item-body">
                  <p className="nn-item-title">{n.title}</p>
                  <p className="nn-item-msg">{n.message}</p>
                  <span className="nn-item-type">{TYPE_LABELS[n.type] || n.type}</span>
                </div>
                <div className="nn-item-right">
                  <span className="nn-item-time">{formatDate(n.createdAt)}</span>
                  <button className="nn-item-delete" onClick={e => handleDelete(n.id, e)} aria-label="Delete">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
