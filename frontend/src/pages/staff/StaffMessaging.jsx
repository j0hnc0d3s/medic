import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

import messagingService from '../../services/messagingService'
import patientService from '../../services/patientService'
import './StaffMessaging.css'

export default function StaffMessaging() {
  const { userProfile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConvo, setSelectedConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [showNewConvoModal, setShowNewConvoModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState('')

  // Real-time listeners cleanup
  const unsubscribeConversations = useRef(null)
  const unsubscribeMessages = useRef(null)

  useEffect(() => {
    console.log("🚀 Component mounted, userProfile:", userProfile?.uid);
    
    if (userProfile?.uid) {
      loadPatients()
      setupConversationListener()
    }
    
    const timeout = setTimeout(() => {
      console.warn("⏱️ Timeout - stopping loading");
      setLoading(false);
    }, 5000);

    return () => {
      console.log("🧹 Cleanup running");
      clearTimeout(timeout);
      if (unsubscribeConversations.current) unsubscribeConversations.current()
      if (unsubscribeMessages.current) unsubscribeMessages.current()
    }
  }, [userProfile?.uid])

  useEffect(() => {
    if (selectedConvo) {
      console.log("💬 Selected conversation:", selectedConvo.id);
      setupMessagesListener()
      markConversationAsRead()
    }

    return () => {
      if (unsubscribeMessages.current) unsubscribeMessages.current()
    }
  }, [selectedConvo?.id])

  const loadPatients = async () => {
    const result = await patientService.getPatients()
    if (result.success) {
      setPatients(result.patients)
    }
  }

  const setupConversationListener = () => {
    console.log("🎧 Setting up conversation listener...");
    
    try {
      unsubscribeConversations.current = messagingService.listenToConversations(
        userProfile.uid,
        (convos) => {
          console.log("✅ Conversations received:", convos.length);
          setConversations(convos)
          
          if (convos.length > 0 && !selectedConvo) {
            setSelectedConvo(convos[0])
          }
          
          setLoading(false)
        }
      )
    } catch (error) {
      console.error("❌ Setup listener error:", error);
      setLoading(false);
    }
  }

  const setupMessagesListener = () => {
    console.log("📩 Setting up messages listener for:", selectedConvo.id);
    
    try {
      unsubscribeMessages.current = messagingService.listenToMessages(
        selectedConvo.id,
        (msgs) => {
          console.log("✅ Messages received:", msgs.length);
          setMessages(msgs)
          
          setTimeout(() => {
            const container = document.querySelector('.messages-container')
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          }, 100)
        }
      )
    } catch (error) {
      console.error("❌ Setup messages listener error:", error);
    }
  }

  const markConversationAsRead = async () => {
    await messagingService.markAsRead(selectedConvo.id, userProfile.uid)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvo) return

    const messageData = {
      text: newMessage.trim(),
      senderId: userProfile.uid,
      senderName: `${userProfile.firstName} ${userProfile.lastName}`,
      senderRole: 'staff'
    }

    const result = await messagingService.sendMessage(selectedConvo.id, messageData)
    
    if (result.success) {
      setNewMessage('')
    } else {
      alert('Failed to send message')
    }
  }

  const startNewConversation = async () => {
    if (!selectedPatient) {
      alert('Please select a patient')
      return
    }

    const patient = patients.find(p => p.id === selectedPatient)
    
    if (!patient) {
      alert('Patient not found')
      return
    }

    const userData = {
      user1Name: `${userProfile.firstName} ${userProfile.lastName}`,
      user1Role: userProfile.role || 'staff',
      user2Name: `${patient.firstName} ${patient.lastName}`,
      user2Role: 'patient'
    }

    const result = await messagingService.getOrCreateConversation(
      userProfile.uid,
      selectedPatient,
      userData
    )

    if (result.success) {
      setSelectedConvo(result.conversation)
      setShowNewConvoModal(false)
      setSelectedPatient('')
    } else {
      alert('Failed to create conversation: ' + (result.error || 'Unknown error'))
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getConversationName = (convo) => {
    return messagingService.getConversationDisplayName(convo, userProfile.uid)
  }

  const getUnreadCount = (convo) => {
    return messagingService.getUnreadCount(convo, userProfile.uid)
  }

  if (loading) {
    return (
      <div className="messaging loading">
        <div className="loading-spinner">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="messaging">
      <div className="messaging-container">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Messages</h2>
            <button 
              className="btn-icon" 
              title="New conversation"
              onClick={() => setShowNewConvoModal(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map(convo => {
                const unreadCount = getUnreadCount(convo)

                return (
                  <div
                    key={convo.id}
                    className={`conversation-item ${selectedConvo?.id === convo.id ? 'active' : ''}`}
                    onClick={() => setSelectedConvo(convo)}
                  >
                    <div className="convo-avatar" style={{ background: '#1F4788' }}>
                      {getInitials(getConversationName(convo))}
                    </div>

                    <div className="convo-content">
                      <div className="convo-header">
                        <span className="convo-name">{getConversationName(convo)}</span>
                        <span className="convo-time">{formatDate(convo.lastMessageAt)}</span>
                      </div>
                      <p className="convo-preview">{convo.lastMessage || 'No messages yet'}</p>
                    </div>
                    
                    {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
                  </div>
                )
              })
            ) : (
              <div className="empty-conversations">
                <p>No conversations yet</p>

                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowNewConvoModal(true)}
                >
                  Start a conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConvo ? (
          <div className="chat-area">
            <div className="chat-header">
              <div className="chat-avatar" style={{ background: '#2D9C9C' }}>
                {getInitials(getConversationName(selectedConvo))}
              </div>

              <div className="chat-info">
                <h3 className="chat-name">{getConversationName(selectedConvo)}</h3>
                <p className="chat-status">Patient</p>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg, index) => {
                const showDate = index === 0 || formatDate(messages[index - 1].timestamp) !== formatDate(msg.timestamp)
                const isSentByMe = msg.senderId === userProfile.uid
                
                return (
                  <div key={msg.id}>
                    {showDate && <div className="date-divider">{formatDate(msg.timestamp)}</div>}

                    <div className={`message ${isSentByMe ? 'sent' : 'received'}`}>
                      {!isSentByMe && (
                        <div className="message-avatar">
                          {getInitials(msg.senderName)}
                        </div>
                      )}
                      
                      <div className="message-bubble">
                        {!isSentByMe && <div className="message-sender">{msg.senderName}</div>}
                        <p className="message-text">{msg.text}</p>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {messages.length === 0 && (
                <div className="empty-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            <form className="message-input-area" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="message-input"
              />
              <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <p className="no-chat-text">Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConvoModal && (
        <div className="modal-overlay" onClick={() => setShowNewConvoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Conversation</h2>
              <button className="modal-close" onClick={() => setShowNewConvoModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select
                  className="form-select"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowNewConvoModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={startNewConversation}
                disabled={!selectedPatient}
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