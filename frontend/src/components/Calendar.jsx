import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import close from '../assets/inverted/close.png'
import left from '../assets/inverted/left.png'
import right from '../assets/inverted/right.png'
import edit from '../assets/inverted/edit.png'
import notification from '../assets/black/notification.png'
import checked from '../assets/inverted/checked.png'
import unchecked from '../assets/inverted/unchecked.png'
import plus from '../assets/inverted/plus.png'
import notificationService from '../services/notificationService'
import './Calendar.css'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const timeAgo = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Calendar({
  currentUser,
  dayTasks = [],
  dayAgenda = [],
  onAddTask = null,      // (label: string) => void — creates a task
  onCompleteTask = null, // (taskId: string) => void — marks a task done
  onDeleteTask = null,   // (taskId: string) => void — removes a task
  onEditTask = null,     // (taskId: string, newLabel: string) => void
  onDayChange = null,    // (date: Date) => void — fires on day/month navigation,
                         // so the parent can fetch THAT day's real agenda
                         // instead of always showing a fixed list.
  viewerUserId = null,   // the ACTUAL logged-in professional's uid — not the
                         // same thing as currentUser, which in some callers
                         // (e.g. NurseMessaging) displays a patient instead.
                         // The notification bell always needs the real viewer.
}) {
  const today = new Date()
  const navigate = useNavigate()

  const [agendaOpen, setAgendaOpen] = useState(true)
  const [agendaTab, setAgendaTab] = useState('tasks')
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [newTaskText, setNewTaskText] = useState('')

  // ── Notification bell ────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [recentNotifications, setRecentNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)

  useEffect(() => {
    if (!viewerUserId) return
    const refreshUnread = () => {
      notificationService.getUnreadCount(viewerUserId).then(res => {
        if (res.success) setUnreadCount(res.count)
      })
    }
    refreshUnread()
    // Poll rather than a real-time listener — this is a small
    // dropdown, not worth a permanent onSnapshot subscription per
    // instance of this component (it's mounted on several pages).
    const interval = setInterval(refreshUnread, 30000)
    return () => clearInterval(interval)
  }, [viewerUserId])

  const toggleNotifDropdown = async () => {
    const opening = !showNotifDropdown
    setShowNotifDropdown(opening)
    if (opening && viewerUserId) {
      setLoadingNotifs(true)
      try {
        const res = await notificationService.getNotifications({ userId: viewerUserId, limit: 6 })
        if (res.success) setRecentNotifications(res.notifications)
      } finally {
        setLoadingNotifs(false)
      }
    }
  }

  const handleNotifClick = async (n) => {
    if (!n.read) {
      await notificationService.markAsRead(n.id)
      setUnreadCount(c => Math.max(0, c - 1))
      setRecentNotifications(list => list.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    setShowNotifDropdown(false)
    if (n.actionUrl) navigate(n.actionUrl)
  }

  // Tell the parent whenever the selected day actually changes, so it
  // can fetch real appointments for that date — previously nothing
  // outside this component ever knew the selection had moved.
  useEffect(() => {
    if (!selectedDay) return
    onDayChange?.(new Date(calMonth.year, calMonth.month, selectedDay))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calMonth.year, calMonth.month, selectedDay])

  const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay()
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate()
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  const isToday = (d) => d === today.getDate()
    && calMonth.month === today.getMonth()
    && calMonth.year === today.getFullYear()

  const goToPrevMonth = () => setCalMonth(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 })
  const goToNextMonth = () => setCalMonth(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 })

  const submitNewTask = () => {
    const label = newTaskText.trim()
    if (!label) return
    onAddTask?.(label)
    setNewTaskText('')
  }

  const handleEditTask = (task) => {
    if (!onEditTask) return
    const next = window.prompt('Edit task', task.label)
    if (next != null && next.trim()) onEditTask(task.id, next.trim())
  }

  return (
    <>
      {agendaOpen ? (
        <div className="no-agenda">
          <div className="no-agenda-tabs">
            <button className={`no-agenda-tab agenda${agendaTab === 'agenda' ? ' active' : ' inactive'}`}
              onClick={() => setAgendaTab('agenda')}>Agenda</button>
            <button className={`no-agenda-tab tasks${agendaTab === 'tasks' ? ' active' : ' inactive'}`}
              onClick={() => setAgendaTab('tasks')}>Tasks</button>
          </div>

          <div className="no-agenda-body">
            <div className="calendar-body">
              <div className="no-agenda-head">
                <span className="no-agenda-pill">{isToday(selectedDay) ? 'Today' : `${MONTHS[calMonth.month]} ${selectedDay}`}</span>
                <button className="no-agenda-close" onClick={() => setAgendaOpen(false)} aria-label="Collapse panel">
                  <img src={close} className="ns-icon"/>
                </button>
              </div>

              <div className="no-cal-header">
                <h2 className="no-cal-month">{MONTHS[calMonth.month].slice(0, 3)} '{String(calMonth.year).slice(2)}</h2>
                <div className="no-cal-nav">
                  <button className="no-cal-nav-wrap" onClick={goToPrevMonth} aria-label="Previous month">
                    <img src={left} className="ns-icon"/>
                  </button>

                  <button className="no-cal-nav-wrap" onClick={goToNextMonth} aria-label="Next month">
                    <img src={right} className="ns-icon"/>
                  </button>
                </div>
              </div>

              <div className="no-cal-grid">
                {DAY_NAMES.map(d => <span key={d} className="no-cal-dayname">{d}</span>)}
                {cells.map((d, i) => (
                  <button key={i}
                    className={`no-cal-cell${!d ? ' empty' : ''}${d === selectedDay ? ' today' : ''}`}
                    disabled={!d}
                    onClick={() => setSelectedDay(d)}>
                    {d || ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="agenda-area">
              {agendaTab === 'tasks' ? (
                <>
                  <p className="no-tasks-label">Tasks</p>

                  {onAddTask && (
                    <div className="no-task-add-row">
                      <input
                        className="no-task-add-input"
                        placeholder="Add a task…"
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') submitNewTask() }}
                      />
                      <button className="no-task-add-btn" onClick={submitNewTask} aria-label="Add task">
                        <img src={plus} className="ns-sml-icon" />
                      </button>
                    </div>
                  )}

                  {dayTasks.length > 0 ? dayTasks.map(t => (
                    <div key={t.id} className="no-task-item tasks">
                      <button className="no-task-checkbox" onClick={() => onCompleteTask?.(t.id)} aria-label="Mark task complete">
                        <img src={unchecked} className="ns-icon" />
                      </button>

                      <div className="no-task-info">
                        <p className="no-task-name">{t.label}</p>
                        <p className="no-task-when">Today</p>
                      </div>

                      {onEditTask && (
                        <button className="no-task-btn" onClick={() => handleEditTask(t)} aria-label="Edit task">
                          <img src={edit} className="ns-sml-icon"/>
                        </button>
                      )}

                      {onDeleteTask && (
                        <button className="no-task-btn" onClick={() => onDeleteTask(t.id)} aria-label="Delete task">
                          <img src={close} className="ns-sml-icon"/>
                        </button>
                      )}
                    </div>
                  )) : <p className="no-empty-hint">No tasks for this day</p>}
                </>
              ) : (
                <>
                  <p className="no-tasks-label">Agenda</p>
                  {dayAgenda.length > 0 ? dayAgenda.map(a => (
                    <div key={a.id} className="no-task-item agenda">
                      <span className="no-agenda-time">{a.time}</span>
                      <div className="no-task-info">
                        <p className="no-task-name">{a.label}</p>
                      </div>
                    </div>
                  )) : <p className="no-empty-hint">No appointments scheduled</p>}
                </>
              )}

              {currentUser && (
                <div className="no-agenda-patient">
                  <div className="no-profile-av-wrap">
                    <div className="no-profile-av">
                      <img
                        src={currentUser.image}
                        className="no-full-icon"
                        alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      />
                    </div>

                    {currentUser.online && <span className="no-online-dot" />}
                  </div>

                  <div className="ns-patient-info">
                    <span className="ns-patient-name">{currentUser.firstName} {currentUser.lastName}</span>
                    <span className="ns-patient-meta">{currentUser.role}</span>
                  </div>

                  <div className="no-bell-wrap">
                    <button className="no-agenda-bell" aria-label="Notifications" onClick={toggleNotifDropdown}>
                      <img src={notification} className="ns-icon"/>
                      {unreadCount > 0 && <span className="no-notification-dot" />}
                    </button>

                    {showNotifDropdown && (
                      <div className="no-notif-dropdown">
                        <div className="no-notif-dropdown-head">
                          <p className="no-notif-dropdown-title">Notifications</p>
                          <button className="no-notif-dropdown-close" onClick={() => setShowNotifDropdown(false)}>
                            <img src={close} className="ns-sml-icon" />
                          </button>
                        </div>

                        {loadingNotifs ? (
                          <p className="no-notif-empty">Loading…</p>
                        ) : recentNotifications.length > 0 ? (
                          <>
                            {recentNotifications.map(n => (
                              <button key={n.id}
                                className={`no-notif-item${n.read ? '' : ' unread'}`}
                                onClick={() => handleNotifClick(n)}>
                                <p className="no-notif-item-title">{n.title}</p>
                                <p className="no-notif-item-msg">{n.message}</p>
                                <p className="no-notif-item-time">{timeAgo(n.createdAt)}</p>
                              </button>
                            ))}
                            <button className="no-notif-viewall" onClick={() => { setShowNotifDropdown(false); navigate('/staff/notifications') }}>
                              View all
                            </button>
                          </>
                        ) : (
                          <p className="no-notif-empty">No notifications yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button className="no-reopen-tab" onClick={() => setAgendaOpen(true)}>Calendar</button>
      )}
    </>
  )
}