// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseMessaging.jsx
// CSS  : src/pages/staff/NurseMessaging.css
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import messagingService from '../../services/messagingService'
import NurseSidebar from './NurseSidebar'
import Profile from '../../components/Profile'
import './NurseMessaging.css'

import doctor from '../../assets/images/doctor1.jpeg'

const ICONS = {
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  menu: <svg width="4" height="16" viewBox="0 0 4 16" fill="none"><circle cx="2" cy="2" r="2" fill="currentColor"/><circle cx="2" cy="8" r="2" fill="currentColor"/><circle cx="2" cy="14" r="2" fill="currentColor"/></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const CURRENT_USER = { firstName: 'Sarah', lastName: 'Johnson', role: 'Registered Nurse', image: doctor, online: true, notifications: true }
const MOCK_TASKS_TODAY = [
  { id: 1, label: 'Follow up with Martha' },
  { id: 2, label: 'Follow up with Barry' },
]
const MOCK_AGENDA_TODAY = [
  { id: 1, time: '9:00 AM', label: 'H. Evans — General Consultation' },
]

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function groupMessagesByDate(messages) {
  const groups = []
  let lastLabel = null
  messages.forEach(msg => {
    const label = formatDate(msg.timestamp)
    if (label !== lastLabel) {
      lastLabel = label
      groups.push({ dateLabel: label, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  })
  return groups
}

const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export default function NurseMessaging() {
  const { userProfile } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedConvo, setSelectedConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [connecting, setConnecting] = useState(false)
  const messagesRef = useRef(null)
  const unsubscribeMessages = useRef(null)

  // Whenever the sidebar selection changes, get-or-create the conversation
  // with that patient and subscribe to its messages in real time.
  useEffect(() => {
    if (unsubscribeMessages.current) {
      unsubscribeMessages.current()
      unsubscribeMessages.current = null
    }
    setMessages([])
    setSelectedConvo(null)

    if (!selectedPatient || !userProfile?.uid) return

    setConnecting(true)
    const userData = {
      user1Name: `${userProfile.firstName} ${userProfile.lastName}`,
      user1Role: userProfile.role || 'staff',
      user2Name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      user2Role: 'patient',
    }

    messagingService.getOrCreateConversation(userProfile.uid, selectedPatient.id, userData)
      .then(result => {
        if (!result.success) return
        setSelectedConvo(result.conversation)
        unsubscribeMessages.current = messagingService.listenToMessages(
          result.conversation.id,
          (msgs) => setMessages(msgs)
        )
        messagingService.markAsRead(result.conversation.id, userProfile.uid)
      })
      .finally(() => setConnecting(false))

    return () => {
      if (unsubscribeMessages.current) unsubscribeMessages.current()
    }
  }, [selectedPatient?.id, userProfile?.uid])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!draft.trim() || !selectedConvo || !userProfile) return
    const messageData = {
      text: draft.trim(),
      senderId: userProfile.uid,
      senderName: `${userProfile.firstName} ${userProfile.lastName}`,
      senderRole: userProfile.role || 'staff',
    }
    const result = await messagingService.sendMessage(selectedConvo.id, messageData)
    if (result.success) setDraft('')
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="no-shell">
      <NurseSidebar onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="no-chat">
          {!selectedPatient ? (
            <div className="no-chat-empty-state">
              <p className="no-chat-empty-text">Select a patient from the sidebar to start messaging.</p>
            </div>
          ) : (
            <>
              <div className="no-chat-header">
                <div className="no-chat-header-left">
                  <img src={selectedPatient.image} className="no-chat-av" alt="" />
                  <div>
                    <p className="no-chat-name">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p className="no-chat-lastseen">{connecting ? 'Connecting…' : selectedPatient.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>

                <div className="no-chat-header-actions">
                  <button className="no-chat-action-btn" aria-label="Search">{ICONS.search}</button>
                  <button className="no-chat-action-btn" aria-label="More options">{ICONS.menu}</button>
                </div>
              </div>

              <div className="no-chat-messages" ref={messagesRef}>
                <div className="no-chat-watermark">
                  <span className="no-chat-watermark-plus">+</span> Medic
                  <span className="no-chat-watermark-tag">Care without the wait</span>
                </div>

                {messageGroups.map((group, gi) => (
                  <div key={gi} className="no-chat-date-group">
                    <div className="no-chat-date-divider"><span>{group.dateLabel}</span></div>

                    {group.messages.map(msg => {
                      const isMine = msg.senderId === userProfile?.uid
                      return (
                        <div key={msg.id} className={`no-chat-bubble-row${isMine ? ' mine' : ''}`}>
                          <div className="no-chat-bubble-av no-chat-bubble-av--initials">
                            {getInitials(isMine ? `${userProfile.firstName} ${userProfile.lastName}` : msg.senderName)}
                          </div>
                          <div className="no-chat-bubble">
                            <div className="no-chat-bubble-head">
                              <span className="no-chat-bubble-sender">{isMine ? 'You' : msg.senderName}</span>
                              <span className="no-chat-bubble-time">{formatTime(msg.timestamp)}</span>
                            </div>
                            <p className="no-chat-bubble-text">{msg.text}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                {!connecting && messages.length === 0 && (
                  <p className="no-chat-empty-hint">No messages yet. Start the conversation!</p>
                )}
              </div>

              <form className="no-chat-input-row" onSubmit={handleSend}>
                <input
                  className="no-chat-input"
                  placeholder="Send a message"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  disabled={!selectedConvo}
                />
                <button type="submit" className="no-chat-send-btn" aria-label="Send" disabled={!selectedConvo}>{ICONS.send}</button>
              </form>
            </>
          )}
        </div>
      </div>

      <Profile
        currentUser={CURRENT_USER}
        patient={selectedPatient}
        dayTasks={MOCK_TASKS_TODAY}
        dayAgenda={MOCK_AGENDA_TODAY}
      />
    </div>
  )
}