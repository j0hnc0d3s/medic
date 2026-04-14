import { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'

import '../styles/Notifications.css'

import notification from '../../assets/images/notifications.png';
import search from '../../assets/images/search.png';

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const notifQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(notifQuery)
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setNotifications(notifs)
      setLoading(false)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        readAt: Timestamp.now()
      })
      loadNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read)
      await Promise.all(
        unread.map(n => 
          updateDoc(doc(db, 'notifications', n.id), {
            read: true,
            readAt: Timestamp.now()
          })
        )
      )
      loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return
    
    try {
      await deleteDoc(doc(db, 'notifications', id))
      loadNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getIcon = (type) => {
    const icons = {
      appointment: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      alert: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      system: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      message: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      birthday: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 13V7a2 2 0 012-2h8a2 2 0 012 2v6" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
    return icons[type] || icons.system
  }

  const getTypeColor = (type) => {
    const colors = {
      appointment: '#1F4788',
      alert: '#EF4444',
      system: '#6B7280',
      message: '#2D9C9C',
      birthday: '#8B5CF6'
    }
    return colors[type] || '#6B7280'
  }

  const filteredNotifications = notifications.filter(n => {
    const matchesType = filterType === 'all' || n.type === filterType
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'unread' && !n.read) ||
      (filterStatus === 'read' && n.read)
    return matchesType && matchesStatus
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="notifications loading">
        <div className="loading-spinner">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="notifications">
      <div className="notifications-container">
        <header className="notifications-header">
          {unreadCount > 0 && (
            <button className="btn btn-secondary" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
        </header>

        <div className="notifications-search">
          <div className="notifications-search-header">
            <img 
              src={search}
              className="notifications-search-img"
              alt="Search"
            />

            <p className="notifications-search-text">Search</p>
          </div>

          <div className="search-filters">
            <select 
              className="search-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="appointment">Appointments</option>
              <option value="alert">Alerts</option>
              <option value="system">System</option>
              <option value="message">Messages</option>
              <option value="birthday">Birthdays</option>
            </select>

            <select 
              className="search-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div 
                  className="notification-icon"
                  style={{ 
                    background: `${getTypeColor(notif.type)}15`,
                    color: getTypeColor(notif.type)
                  }}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-header-row">
                    <h3 className="notification-title">{notif.title}</h3>
                    <span className="notification-time">{formatTime(notif.createdAt)}</span>
                  </div>
                  <p className="notification-message">{notif.message}</p>
                  {notif.actionText && (
                    <button className="notification-action">
                      {notif.actionText}
                    </button>
                  )}
                </div>

                {!notif.read && <div className="unread-dot" />}

                <button 
                  className="notification-delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification(notif.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="notifications-empty-state">
            <img 
              src={notification} 
              alt="Notifications" 
              className="notification-list-img xlrg"
            />

            <div className="notifications-empty-text">Cleared.</div>
            <div className="notifications-empty-subtext">Nothing to see here.</div>
          </div>
        )}
      </div>
    </div>
  )
}