import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../../services/firebase'
import './PatientActivity.css'

export default function Activities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterUser, setFilterUser] = useState('all')

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(100)
      )
      const snapshot = await getDocs(activitiesQuery)
      const acts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setActivities(acts)
      setLoading(false)
    } catch (error) {
      console.error('Error loading activities:', error)
      setLoading(false)
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
      'patient-added': '👤',
      'patient-updated': '✏️',
      'appointment-created': '📅',
      'appointment-cancelled': '❌',
      'file-uploaded': '📎',
      'report-generated': '📊',
      'staff-added': '👥',
      'finance-recorded': '💰',
      'login': '🔐',
      'logout': '🚪'
    }
    return icons[type] || '•'
  }

  const getTypeColor = (type) => {
    if (type.includes('patient')) return '#1F4788'
    if (type.includes('appointment')) return '#2D9C9C'
    if (type.includes('file') || type.includes('report')) return '#F59E0B'
    if (type.includes('staff')) return '#8B5CF6'
    if (type.includes('finance')) return '#22C55E'
    return '#6B7280'
  }

  const filteredActivities = activities.filter(a => {
    const matchesType = filterType === 'all' || a.type?.includes(filterType)
    const matchesUser = filterUser === 'all' || a.user === filterUser
    return matchesType && matchesUser
  })

  const uniqueUsers = [...new Set(activities.map(a => a.user).filter(Boolean))]

  if (loading) {
    return (
      <div className="activities loading">
        <div className="loading-spinner">Loading activities...</div>
      </div>
    )
  }

  return (
    <div className="activities">
      <div className="activities-container">
        <header className="activities-header">
          <div>
            <h1 className="activities-title">Activity Log</h1>
            <p className="activities-subtitle">{activities.length} total activities</p>
          </div>
        </header>

        <div className="filters-bar">
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="patient">Patient</option>
            <option value="appointment">Appointment</option>
            <option value="file">Files</option>
            <option value="staff">Staff</option>
            <option value="finance">Finance</option>
          </select>

          <select 
            className="filter-select"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>

        {filteredActivities.length > 0 ? (
          <div className="timeline">
            {filteredActivities.map(activity => (
              <div key={activity.id} className="timeline-item">
                <div className="timeline-marker">
                  <div 
                    className="timeline-icon"
                    style={{ background: `${getTypeColor(activity.type)}15`, color: getTypeColor(activity.type) }}
                  >
                    {getIcon(activity.type)}
                  </div>
                  <div className="timeline-line" />
                </div>

                <div className="timeline-content">
                  <div className="activity-header">
                    <h3 className="activity-title">{activity.action}</h3>
                    <span className="activity-time">{formatTime(activity.timestamp)}</span>
                  </div>
                  {activity.description && (
                    <p className="activity-description">{activity.description}</p>
                  )}
                  <div className="activity-meta">
                    {activity.user && (
                      <span className="activity-user">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {activity.user}
                      </span>
                    )}
                    {activity.entity && (
                      <span className="activity-entity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M13 2v7h7" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {activity.entity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No activities found</div>
            <div className="empty-subtext">
              {filterType !== 'all' || filterUser !== 'all'
                ? 'Try adjusting your filters'
                : 'Activity will appear here as actions are performed'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}