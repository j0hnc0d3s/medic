// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientMessaging.jsx
// CSS  : src/pages/staff/NurseMessaging.css (shared — same .no-msg-*
//        and .ns-* classes)
//
// Conversation list + chat thread — no clinical quick-info panel
// (that was for staff looking up a PATIENT's info; here the patient
// is talking to their own doctor, nothing to look up about
// themselves). The conversation list here only lets you switch
// between conversations you already have — there's no "+" to start
// a new one with an arbitrary doctor, matching PatientSidebar's own
// "no directory browse" rule. Starting a *new* conversation happens
// from PatientSidebar's doctor-contacts list, which navigates here
// with { state: { doctorId } }; this page just consumes that.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import messagingService from '../../services/messagingService'
import '../staff/NurseSidebar.css'
import './PatienteMessaging.css'

import settings from '../../assets/inverted/settings.png'
import logout from '../../assets/inverted/logout.png'

const NAV_ITEMS = [
  { key: 'overview',     label: 'Overview',     path: '/patient/overview',     icon: 'home'   },
  { key: 'appointments', label: 'Appointments', path: '/patient/appointments', icon: 'clock'  },
  { key: 'messaging',    label: 'Messaging',    path: '/patient/messaging',    icon: 'send'   },
  { key: 'documents',    label: 'Documents',    path: '/patient/documents',    icon: 'folder' },
]

const ICONS = {
  home:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  send:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
}

const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const dayKeyOf = (d) => d.toDateString()

const formatDayLabel = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'
  const day = date.getDate()
  const suffix = (day % 10 === 1 && day !== 11) ? 'st' : (day % 10 === 2 && day !== 12) ? 'nd' : (day % 10 === 3 && day !== 13) ? 'rd' : 'th'
  return `${date.toLocaleDateString('en-US', { month: 'long' })} ${day}${suffix}`
}

const formatTime = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return isNaN(d) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function PatientMessaging() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userProfile } = useAuth()
  const currentUserId = userProfile?.uid

  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [search, setSearch] = useState('')

  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!currentUserId) return
    const unsubscribe = messagingService.listenToConversations(currentUserId, setConversations)
    return () => unsubscribe?.()
  }, [currentUserId])

  // Entry point from PatientSidebar's doctor-contacts list.
  useEffect(() => {
    const doctorId = location.state?.doctorId
    if (!doctorId || !currentUserId || !userProfile) return
    const existing = conversations.find(c => c.participants?.includes(doctorId))
    if (existing) { setSelectedConversation(existing); return }

    messagingService.getOrCreateConversation(currentUserId, doctorId, {
      user1Name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
      user1Role: 'patient',
      user2Name: 'Doctor', // real name comes from participantDetails once the conversation loads
      user2Role: 'doctor',
    }).then(res => {
      if (res.success) setSelectedConversation(res.conversation)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.doctorId, currentUserId, conversations.length])

  useEffect(() => {
    if (!selectedConversation?.id) { setMessages([]); return }
    const unsubscribe = messagingService.listenToMessages(selectedConversation.id, setMessages)
    messagingService.markAsRead(selectedConversation.id, currentUserId)
    return () => unsubscribe?.()
  }, [selectedConversation?.id, currentUserId])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const visibleConversations = useMemo(() => {
    return conversations.filter(c =>
      messagingService.getConversationDisplayName(c, currentUserId).toLowerCase().includes(search.toLowerCase())
    )
  }, [conversations, search, currentUserId])

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConversation) return
    const patientName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Patient'
    const text = messageText
    setMessageText('')
    await messagingService.sendMessage(selectedConversation.id, {
      text, senderId: currentUserId, senderName: patientName, senderRole: 'patient',
    })
  }

  const handleLogout = async () => {
    try { await signOut(auth) } catch (err) { console.error('Logout error:', err) }
    finally { navigate('/login') }
  }

  const activeKey = NAV_ITEMS.find(i => location.pathname.startsWith(i.path))?.key || 'messaging'

  const messageGroups = useMemo(() => {
    const groups = []
    let lastDay = null
    messages.forEach(m => {
      const d = m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp)
      const key = dayKeyOf(d)
      if (key !== lastDay) { groups.push({ type: 'divider', label: formatDayLabel(d), key: `divider-${key}` }); lastDay = key }
      groups.push({ type: 'message', data: m, key: m.id })
    })
    return groups
  }, [messages])

  const otherName = selectedConversation
    ? messagingService.getConversationDisplayName(selectedConversation, currentUserId)
    : ''

  return (
    <div className="no-msg-shell">

      {/* ── Conversation list — switch between existing threads
            only; no "+" to start a new one, see file header. ──── */}
      <div className="ns-shell">
        <div className="ns-patients">
          <div className="ns-search-row">
            <div className="ns-search">
              <input className="ns-search-input" placeholder="Search"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="ns-patient-list">
            {visibleConversations.map(c => {
              const name = messagingService.getConversationDisplayName(c, currentUserId)
              const unread = messagingService.getUnreadCount(c, currentUserId)
              return (
                <div key={c.id}
                  className={`ns-patient-item${selectedConversation?.id === c.id ? ' active' : ''}`}
                  onClick={() => setSelectedConversation(c)}>
                  <div className="ns-patient-av-wrap">
                    <div className="ns-patient-av" style={{ background: '#1F4788' }}>
                      <span className="ns-av-initials">{getInitials(name)}</span>
                    </div>
                    {unread > 0 && <span className="no-msg-unread-badge">{unread}</span>}
                  </div>
                  <div className="ns-patient-info">
                    <span className="ns-patient-name">{name}</span>
                    <span className="ns-patient-meta">{c.lastMessage || 'No messages yet'}</span>
                  </div>
                </div>
              )
            })}

            {visibleConversations.length === 0 && (
              <p className="ns-loading-label">
                No conversations yet. Message a doctor from the Overview or Appointments sidebar to start one.
              </p>
            )}
          </div>
        </div>

        <div className="ns-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.key}
              className={`ns-nav-item${activeKey === item.key ? ' active' : ''}`}
              onClick={() => navigate(item.path)}>
              <div className={`ns-nav-icon${activeKey === item.key ? ' active' : ''}`}>{ICONS[item.icon]}</div>
              <span className="ns-nav-label">{item.label}</span>
            </button>
          ))}
          <div className="ns-nav-spacer" />
          <div className="ns-nav-footer">
            <button className="ns-icon-btn" onClick={() => navigate('/patient/settings')} aria-label="Settings">
              <img src={settings} className="ns-alt-icon" alt="" />
            </button>
            <button className="ns-icon-btn" onClick={handleLogout} aria-label="Log out">
              <img src={logout} className="ns-other-icon" alt="" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Chat thread ──────────────────────────────────── */}
      <div className="no-msg-main">
        {!selectedConversation ? (
          <div className="no-msg-empty">
            <p className="no-msg-empty-text">Select a conversation to start messaging.</p>
          </div>
        ) : (
          <>
            <div className="no-msg-header">
              <div className="no-msg-header-patient">
                <div className="no-msg-header-av">{getInitials(otherName)}</div>
                <div>
                  <p className="no-msg-header-name">{otherName}</p>
                  <p className="no-msg-header-sub">
                    {messages.length > 0 ? `Last seen ${formatTime(messages[messages.length - 1]?.timestamp)}` : 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="no-msg-thread">
              {messageGroups.map(g => g.type === 'divider' ? (
                <div key={g.key} className="no-msg-divider"><span>{g.label}</span></div>
              ) : (
                <div key={g.key} className={`no-msg-row${g.data.senderId === currentUserId ? ' me' : ''}`}>
                  <div className="no-msg-bubble">
                    <div className="no-msg-bubble-head">
                      <span className="no-msg-bubble-name">{g.data.senderId === currentUserId ? 'You' : g.data.senderName}</span>
                      <span className="no-msg-bubble-time">{formatTime(g.data.timestamp)}</span>
                    </div>
                    <p className="no-msg-bubble-text">{g.data.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="no-msg-input-row">
              <input className="no-msg-input" placeholder="Send a message"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }} />
              <button className="no-msg-send-btn" onClick={handleSend} aria-label="Send">→</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
