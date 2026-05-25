// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/StaffMessaging.jsx
// CSS  : src/pages/styles/Messaging.css  (shared)
// ─────────────────────────────────────────────────────────
import { useState, useNavigate, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import messagingService from '../../services/messagingService'
import { patientService } from '../../services'
import '../styles/Messaging.css'

import editImg     from '../../assets/images/edit.png'
import searchImg   from '../../assets/images/search.png'
import inboxImg    from '../../assets/images/inbox.png'
import chattingImg from '../../assets/images/chatting.png'
import sendImg     from '../../assets/images/send.png'
import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'


// ── Helpers ───────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

const fmtTime = ts => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' })
}

const fmtDate = ts => {
  if (!ts) return ''
  const d   = ts.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

const MSG_FILTERS = ['All','Patients','Staff']

// ── Component ─────────────────────────────────────────────
const STAFF_NAV = [
  { img: homeImg, path: '/staff/overview', title: 'Home', active: false },
  { img: phoneImg, path: '/staff/messaging', title: 'Messaging', active: true },
  { img: clockImg, path: '/staff/appointments', title: 'Appointments', active: false },
  { img: schedImg, path: '/staff/calendar', title: 'Calendar', active: false },
]

export default function StaffMessaging() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const [conversations,    setConversations]    = useState([])
  const [selectedConvo,    setSelectedConvo]    = useState(null)
  const [messages,         setMessages]         = useState([])
  const [newMessage,       setNewMessage]       = useState('')
  const [loading,          setLoading]          = useState(true)
  const [patients,         setPatients]         = useState([])
  const [showModal,        setShowModal]        = useState(false)
  const [selectedPatient,  setSelectedPatient]  = useState('')
  const [activeFilter,     setActiveFilter]     = useState('All')

  const unsubConversations = useRef(null)
  const unsubMessages      = useRef(null)

  useEffect(() => {
    if (userProfile?.uid) { loadPatients(); setupConversationListener() }
    const timeout = setTimeout(() => setLoading(false), 5000)
    return () => {
      clearTimeout(timeout)
      if (unsubConversations.current) unsubConversations.current()
      if (unsubMessages.current)      unsubMessages.current()
    }
  }, [userProfile?.uid])

  useEffect(() => {
    if (selectedConvo) { setupMessagesListener(); markAsRead() }
    return () => { if (unsubMessages.current) unsubMessages.current() }
  }, [selectedConvo?.id])

  const loadPatients = async () => {
    const res = await patientService.getPatients()
    if (res.success) setPatients(res.patients)
  }

  const setupConversationListener = () => {
    try {
      unsubConversations.current = messagingService.listenToConversations(
        userProfile.uid,
        convos => {
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
        msgs => {
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

  const sendMessage = async e => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvo) return
    const res = await messagingService.sendMessage(selectedConvo.id, {
      text      : newMessage.trim(),
      senderId  : userProfile.uid,
      senderName: `${userProfile.firstName} ${userProfile.lastName}`,
      senderRole: 'staff',
    })
    if (res.success) setNewMessage('')
    else alert('Failed to send message')
  }

  const startNewConversation = async () => {
    if (!selectedPatient) return alert('Please select a patient')
    const patient = patients.find(p => p.id === selectedPatient)
    if (!patient) return alert('Patient not found')

    const res = await messagingService.getOrCreateConversation(
      userProfile.uid, selectedPatient, {
        user1Name: `${userProfile.firstName} ${userProfile.lastName}`,
        user1Role: userProfile.role || 'staff',
        user2Name: `${patient.firstName} ${patient.lastName}`,
        user2Role: 'patient',
      }
    )
    if (res.success) {
      setSelectedConvo(res.conversation)
      setShowModal(false)
      setSelectedPatient('')
    } else alert('Failed to create conversation: ' + (res.error || 'Unknown error'))
  }

  const getConvoName = c => messagingService.getConversationDisplayName(c, userProfile.uid)
  const getConvoRole = c => {
    const role = messagingService.getOtherParticipantRole(c, userProfile.uid)
    return { admin:'Administrator', doctor:'Doctor', nurse:'Nurse',
             receptionist:'Receptionist', staff:'Staff', patient:'Patient' }[role] || 'User'
  }
  const getUnread = c => messagingService.getUnreadCount(c, userProfile.uid)

  const filtered = conversations.filter(c => {
    if (activeFilter === 'All') return true
    const role = messagingService.getOtherParticipantRole(c, userProfile.uid)
    if (activeFilter === 'Patients') return role === 'patient'
    return ['doctor','nurse','staff','receptionist','admin'].includes(role)
  })

  if (loading) return (
    <div className="msg-shell">
      {/* ── Left icon sidebar ──────────────────────── */}
      <aside className="pv-aside">
        {STAFF_NAV.map(({ img, path, title, active }) => (
          <button key={title} title={title} aria-label={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}>
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </aside>

      <div className="msg-loading"><div className="msg-spinner" /></div>
    </div>
  )

  return (
    <div className="msg-shell">
      <div className="msg-page">
        <div className="msg-container">

          {/* ── Sidebar ───────────────────────── */}
          <div className="msg-sidebar">
            <div className="msg-sidebar-head">
              <h1 className="msg-heading">Messages</h1>
              <button className="msg-compose-btn"
                onClick={() => setShowModal(true)} aria-label="New conversation">
                <img src={editImg} alt="New" className="msg-compose-icon" />
              </button>
            </div>

            <div className="msg-search">
              <img src={searchImg} alt="" className="msg-search-icon" />
              <span className="msg-search-text">Search</span>
            </div>

            <div className="msg-filters">
              {MSG_FILTERS.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`msg-filter-pill${activeFilter === f ? ' active' : ''}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="msg-list">
              {filtered.length > 0 ? filtered.map(convo => {
                const unread   = getUnread(convo)
                const isActive = selectedConvo?.id === convo.id
                return (
                  <div key={convo.id}
                    className={`msg-convo-item${isActive ? ' active' : ''}`}
                    onClick={() => setSelectedConvo(convo)}>
                    <div className="msg-convo-av">{getInitials(getConvoName(convo))}</div>
                    <div className="msg-convo-body">
                      <div className="msg-convo-row">
                        <span className="msg-convo-name">{getConvoName(convo)}</span>
                        <span className="msg-convo-time">{fmtDate(convo.lastMessageAt)}</span>
                      </div>
                      <p className="msg-convo-preview">{convo.lastMessage || 'No messages yet'}</p>
                    </div>
                    {unread > 0 && <div className="msg-unread-badge">{unread}</div>}
                  </div>
                )
              }) : (
                <div className="msg-empty-convos">
                  <img src={inboxImg} alt="" className="msg-empty-img" />
                  <p className="msg-empty-text">No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat ──────────────────────────── */}
          {selectedConvo ? (
            <div className="msg-chat">
              <div className="msg-chat-head">
                <div className="msg-chat-av">{getInitials(getConvoName(selectedConvo))}</div>
                <div className="msg-chat-info">
                  <h2 className="msg-chat-name">{getConvoName(selectedConvo)}</h2>
                  <p className="msg-chat-role">{getConvoRole(selectedConvo)}</p>
                </div>
              </div>

              <div className="msg-messages">
                {messages.map((msg, i) => {
                  const showDate = i === 0 || fmtDate(messages[i-1].timestamp) !== fmtDate(msg.timestamp)
                  const isMine   = msg.senderId === userProfile.uid
                  return (
                    <div key={msg.id}>
                      {showDate && <div className="msg-date-divider">{fmtDate(msg.timestamp)}</div>}
                      <div className={`msg-bubble-wrap ${isMine ? 'sent' : 'received'}`}>
                        {!isMine && <div className="msg-bubble-av">{getInitials(msg.senderName)}</div>}
                        <div className={`msg-bubble ${isMine ? 'sent' : 'received'}`}>
                          <p className="msg-bubble-text">{msg.text}</p>
                          <span className="msg-bubble-time">{fmtTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {messages.length === 0 && (
                  <div className="msg-empty-chat"><p>No messages yet — say hello!</p></div>
                )}
              </div>

              <form className="msg-input-area" onSubmit={sendMessage}>
                <input type="text" placeholder="Type a message..." value={newMessage}
                  onChange={e => setNewMessage(e.target.value)} className="msg-input" />
                <button type="submit" className="msg-send-btn"
                  disabled={!newMessage.trim()} aria-label="Send">
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

      {/* ── New conversation modal ──────────────── */}
      {showModal && (
        <div className="msg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="msg-modal" onClick={e => e.stopPropagation()}>
            <div className="msg-modal-head">
              <h2 className="msg-modal-title">New Conversation</h2>
              <button className="msg-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="msg-modal-body">
              <label className="msg-modal-label">Select Patient</label>
              {patients.length === 0 ? (
                <p className="msg-modal-hint">No patients found.</p>
              ) : (
                <select className="msg-modal-select" value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}>
                  <option value="">Choose a patient…</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="msg-modal-foot">
              <button className="msg-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="msg-modal-confirm"
                onClick={startNewConversation}
                disabled={!selectedPatient}>
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
