// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientMessaging.jsx
// CSS  : src/pages/styles/Messaging.css
// ─────────────────────────────────────────────────────────
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import messagingService from '../../services/messagingService'

import '../styles/Messaging.css'

// ── Sidebar nav images ────────────────────────────────────
import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'

// ── Messaging images ──────────────────────────────────────
import editImg    from '../../assets/images/edit.png'
import searchImg  from '../../assets/images/search.png'
import inboxImg   from '../../assets/images/inbox.png'
import chattingImg from '../../assets/images/chatting.png'
import sendImg    from '../../assets/images/send.png'

// ── Helpers ───────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

const fmtTime = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const fmtDate = (ts) => {
  if (!ts) return ''
  const d   = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SIDEBAR_NAV = [
  { img: homeImg,  path: '/patient/overview',     title: 'Home',         active: false },
  { img: phoneImg, path: '/patient/messaging',    title: 'Messaging',    active: true  },
  { img: clockImg, path: '/patient/appointments', title: 'Appointments', active: false },
  { img: schedImg, path: '/patient/calendar',     title: 'Calendar',     active: false },
]

const MSG_FILTERS = ['All', 'Staff', 'Doctors']

// ── Component ─────────────────────────────────────────────
export default function PatientMessaging() {
  const { userProfile } = useAuth()
  const navigate        = useNavigate()

  const [conversations,       setConversations]       = useState([])
  const [selectedConvo,       setSelectedConvo]       = useState(null)
  const [messages,            setMessages]            = useState([])
  const [newMessage,          setNewMessage]          = useState('')
  const [loading,             setLoading]             = useState(true)
  const [staff,               setStaff]               = useState([])
  const [loadingStaff,        setLoadingStaff]        = useState(true)
  const [showNewConvoModal,   setShowNewConvoModal]   = useState(false)
  const [selectedStaff,       setSelectedStaff]       = useState('')
  const [activeFilter,        setActiveFilter]        = useState('All')

  const unsubConversations = useRef(null)
  const unsubMessages      = useRef(null)

  useEffect(() => {
    if (userProfile?.uid) {
      loadStaff()
      setupConversationListener()
    }
    const timeout = setTimeout(() => setLoading(false), 5000)
    return () => {
      clearTimeout(timeout)
      if (unsubConversations.current) unsubConversations.current()
      if (unsubMessages.current)      unsubMessages.current()
    }
  }, [userProfile?.uid])

  useEffect(() => {
    if (selectedConvo) {
      setupMessagesListener()
      markAsRead()
    }
    return () => { if (unsubMessages.current) unsubMessages.current() }
  }, [selectedConvo?.id])

  const loadStaff = async () => {
    setLoadingStaff(true)
    try {
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['doctor', 'nurse', 'staff', 'receptionist', 'admin'])
      )
      const snap = await getDocs(q)
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.isActive !== false))
    } catch (e) { console.error('Staff load failed:', e) }
    setLoadingStaff(false)
  }

  const setupConversationListener = () => {
    try {
      unsubConversations.current = messagingService.listenToConversations(
        userProfile.uid,
        (convos) => {
          setConversations(convos)
          if (convos.length > 0 && !selectedConvo) setSelectedConvo(convos[0])
          setLoading(false)
        }
      )
    } catch (e) { console.error(e); setLoading(false) }
  }

  const setupMessagesListener = () => {
    try {
      unsubMessages.current = messagingService.listenToMessages(
        selectedConvo.id,
        (msgs) => {
          setMessages(msgs)
          setTimeout(() => {
            const el = document.querySelector('.msg-messages')
            if (el) el.scrollTop = el.scrollHeight
          }, 100)
        }
      )
    } catch (e) { console.error(e) }
  }

  const markAsRead = async () => {
    await messagingService.markAsRead(selectedConvo.id, userProfile.uid)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvo) return
    const result = await messagingService.sendMessage(selectedConvo.id, {
      text      : newMessage.trim(),
      senderId  : userProfile.uid,
      senderName: `${userProfile.firstName} ${userProfile.lastName}`,
      senderRole: 'patient',
    })
    if (result.success) setNewMessage('')
    else alert('Failed to send message')
  }

  const startNewConversation = async () => {
    if (!selectedStaff) return alert('Please select a staff member')
    const staffMember = staff.find(s => s.id === selectedStaff)
    if (!staffMember) return alert('Staff member not found')

    const result = await messagingService.getOrCreateConversation(
      userProfile.uid, selectedStaff, {
        user1Name: `${userProfile.firstName} ${userProfile.lastName}`,
        user1Role: 'patient',
        user2Name: `${staffMember.firstName} ${staffMember.lastName}`,
        user2Role: staffMember.role || 'staff',
      }
    )
    if (result.success) {
      setSelectedConvo(result.conversation)
      setShowNewConvoModal(false)
      setSelectedStaff('')
    } else alert('Failed to create conversation: ' + (result.error || 'Unknown error'))
  }

  const getConvoName = (c) => messagingService.getConversationDisplayName(c, userProfile.uid)
  const getConvoRole = (c) => {
    const role = messagingService.getOtherParticipantRole(c, userProfile.uid)
    return { admin: 'Administrator', doctor: 'Doctor', nurse: 'Nurse',
             receptionist: 'Receptionist', staff: 'Staff', patient: 'Patient' }[role] || 'User'
  }
  const getUnread = (c) => messagingService.getUnreadCount(c, userProfile.uid)

  // Filter conversations based on active tab
  const filtered = conversations.filter(c => {
    if (activeFilter === 'All') return true
    const role = messagingService.getOtherParticipantRole(c, userProfile.uid)
    if (activeFilter === 'Doctors') return role === 'doctor'
    return ['nurse','staff','receptionist','admin'].includes(role)
  })

  if (loading) return (
    <div className="msg-shell">
      <div className="msg-loading"><div className="msg-spinner" /></div>
    </div>
  )

  return (
    <div className="msg-shell">

      {/* ── Left icon sidebar ──────────────────────── */}
      <aside className="pv-aside">
        {SIDEBAR_NAV.map(({ img, path, title, active }) => (
          <button
            key={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
            title={title}
            aria-label={title}
          >
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </aside>

      {/* ── Content ──────────────────────────────────── */}
      <div className="msg-page">
        <div className="msg-container">

          {/* ── Left: Conversations ──────────────────── */}
          <div className="msg-sidebar">

            {/* Heading + compose button */}
            <div className="msg-sidebar-head">
              <h1 className="msg-heading">Messages</h1>
              <button
                className="msg-compose-btn"
                onClick={() => setShowNewConvoModal(true)}
                aria-label="New conversation"
              >
                <img src={editImg} alt="New" className="msg-compose-icon" />
              </button>
            </div>

            {/* Search bar */}
            <div className="msg-search">
              <img src={searchImg} alt="Search" className="msg-search-icon" />
              <span className="msg-search-text">Search</span>
            </div>

            {/* Filter pills */}
            <div className="msg-filters">
              {MSG_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`msg-filter-pill${activeFilter === f ? ' active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Conversation list */}
            <div className="msg-list">
              {filtered.length > 0 ? filtered.map(convo => {
                const unread  = getUnread(convo)
                const isActive = selectedConvo?.id === convo.id
                return (
                  <div
                    key={convo.id}
                    className={`msg-convo-item${isActive ? ' active' : ''}`}
                    onClick={() => setSelectedConvo(convo)}
                  >
                    <div className="msg-convo-av">
                      {getInitials(getConvoName(convo))}
                    </div>

                    <div className="msg-convo-body">
                      <div className="msg-convo-row">
                        <span className="msg-convo-name">{getConvoName(convo)}</span>
                        <span className="msg-convo-time">{fmtDate(convo.lastMessageAt)}</span>
                      </div>
                      <p className="msg-convo-preview">
                        {convo.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {unread > 0 && (
                      <div className="msg-unread-badge">{unread}</div>
                    )}
                  </div>
                )
              }) : (
                <div className="msg-empty-convos">
                  <img src={inboxImg} alt="Inbox" className="msg-empty-img" />
                  <p className="msg-empty-text">No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Chat ───────────────────────────── */}
          {selectedConvo ? (
            <div className="msg-chat">

              {/* Header */}
              <div className="msg-chat-head">
                <div className="msg-chat-av">
                  {getInitials(getConvoName(selectedConvo))}
                </div>
                <div className="msg-chat-info">
                  <h2 className="msg-chat-name">{getConvoName(selectedConvo)}</h2>
                  <p className="msg-chat-role">{getConvoRole(selectedConvo)}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="msg-messages">
                {messages.map((msg, i) => {
                  const showDate  = i === 0 || fmtDate(messages[i-1].timestamp) !== fmtDate(msg.timestamp)
                  const isMine    = msg.senderId === userProfile.uid
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="msg-date-divider">{fmtDate(msg.timestamp)}</div>
                      )}
                      <div className={`msg-bubble-wrap ${isMine ? 'sent' : 'received'}`}>
                        {!isMine && (
                          <div className="msg-bubble-av">{getInitials(msg.senderName)}</div>
                        )}
                        <div className={`msg-bubble ${isMine ? 'sent' : 'received'}`}>
                          <p className="msg-bubble-text">{msg.text}</p>
                          <span className="msg-bubble-time">{fmtTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {messages.length === 0 && (
                  <div className="msg-empty-chat">
                    <p>No messages yet — say hello!</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <form className="msg-input-area" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="msg-input"
                />
                <button
                  type="submit"
                  className="msg-send-btn"
                  disabled={!newMessage.trim()}
                  aria-label="Send"
                >
                  <img src={sendImg} alt="Send" className="msg-send-icon" />
                </button>
              </form>
            </div>
          ) : (
            <div className="msg-no-chat">
              <img src={chattingImg} alt="" className="msg-no-chat-img" />
              <p className="msg-no-chat-text">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* ── New conversation modal ────────────────────── */}
      {showNewConvoModal && (
        <div className="msg-modal-overlay" onClick={() => setShowNewConvoModal(false)}>
          <div className="msg-modal" onClick={e => e.stopPropagation()}>
            <div className="msg-modal-head">
              <h2 className="msg-modal-title">New Conversation</h2>
              <button className="msg-modal-close" onClick={() => setShowNewConvoModal(false)}>
                ×
              </button>
            </div>

            <div className="msg-modal-body">
              <label className="msg-modal-label">Select Doctor / Staff</label>
              {loadingStaff ? (
                <p className="msg-modal-hint">Loading staff...</p>
              ) : staff.length === 0 ? (
                <p className="msg-modal-hint">No staff found. Contact administration.</p>
              ) : (
                <select
                  className="msg-modal-select"
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(e.target.value)}
                >
                  <option value="">Choose a doctor or staff member...</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.role === 'doctor' ? 'Dr. ' : ''}{s.firstName} {s.lastName}
                      {s.specialization ? ` — ${s.specialization}` : s.department ? ` — ${s.department}` : ` — ${s.role || 'Staff'}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="msg-modal-foot">
              <button className="msg-modal-cancel" onClick={() => setShowNewConvoModal(false)}>
                Cancel
              </button>
              <button
                className="msg-modal-confirm"
                onClick={startNewConversation}
                disabled={!selectedStaff || loadingStaff}
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}