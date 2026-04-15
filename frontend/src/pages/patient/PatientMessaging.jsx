import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import messagingService from '../../services/messagingService'
import staffService from '../../services/staffService'

import '../styles/Messaging.css'

import edit from '../../assets/images/edit.png';
import search from '../../assets/images/search.png';
import down from '../../assets/images/down.png';
import inbox from '../../assets/images/inbox.png';
import chatting from '../../assets/images/chatting.png';
import send from '../../assets/images/send.png';

export default function PatientMessaging() {
  const { userProfile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConvo, setSelectedConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [showNewConvoModal, setShowNewConvoModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState('')

  const unsubscribeConversations = useRef(null)
  const unsubscribeMessages = useRef(null)

  useEffect(() => {
    console.log("🚀 Component mounted, userProfile:", userProfile?.uid);
    
    if (userProfile?.uid) {
      loadStaff()
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

  const loadStaff = async () => {
    console.log("👥 Loading staff...");
    setLoadingStaff(true)
    
    try {
      const usersRef = collection(db, 'users')
      const q = query(
        usersRef,
        where('role', 'in', ['doctor', 'nurse', 'staff', 'receptionist', 'admin'])
      )
      const snapshot = await getDocs(q)
      
      const staffList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.isActive !== false)  // filter client-side
      
      console.log("✅ Staff loaded:", staffList.length)
      setStaff(staffList)
    } catch (error) {
      console.error("❌ Staff load failed:", error)
    }
    
    setLoadingStaff(false)
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
      senderRole: 'patient'
    }

    const result = await messagingService.sendMessage(selectedConvo.id, messageData)
    
    if (result.success) {
      setNewMessage('')
    } else {
      alert('Failed to send message')
    }
  }

  const startNewConversation = async () => {
    if (!selectedStaff) {
      alert('Please select a staff member')
      return
    }

    const staffMember = staff.find(s => s.id === selectedStaff)
    
    if (!staffMember) {
      alert('Staff member not found')
      return
    }

    const userData = {
      user1Name: `${userProfile.firstName} ${userProfile.lastName}`,
      user1Role: 'patient',
      user2Name: `${staffMember.firstName} ${staffMember.lastName}`,
      user2Role: staffMember.role || 'staff'
    }

    const result = await messagingService.getOrCreateConversation(
      userProfile.uid,
      selectedStaff,
      userData
    )

    if (result.success) {
      setSelectedConvo(result.conversation)
      setShowNewConvoModal(false)
      setSelectedStaff('')
    } else {
      alert('Failed to create conversation: ' + (result.error || 'Unknown error'))
    }
  }

    const getConversationRole = (convo) => {
      const role = messagingService.getOtherParticipantRole(convo, userProfile.uid)
      const labels = {
        admin: 'Administrator',
        doctor: 'Doctor',
        nurse: 'Nurse',
        receptionist: 'Receptionist',
        staff: 'Staff',
        patient: 'Patient'
      }
      return labels[role] || 'User'
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
    <>
      <div className="messaging">
        <div className="messaging-container">
          <div className="conversations-sidebar">
            <div className="messages-search">
              <div className="messages-search-area">
                <img 
                  src={search}
                  className="messaging-search-img"
                  alt="Search"
                />
                <p className="messages-search-text">Search</p>
              </div>

              <div className="messages-search-btns">
                <div className="messages-filter">
                  <p className="messages-filter-title">Unread</p>
                  
                  <img 
                    src={down}
                    className="messaging-down-img"
                    alt="Filter"
                  />
                </div>

                <button 
                  className="messages-add-btn" 
                  title="New conversation"
                  onClick={() => setShowNewConvoModal(true)}
                >
                  <img 
                    src={edit}
                    className="messaging-add-img"
                    alt="New conversation"
                  /> 
                </button>
              </div>
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
                      <div className="convo-avatar" style={{ background: '#0088FF' }}>
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
                  <img 
                    src={inbox}
                    className="messaging-inbox-img"
                  />

                  <p class="empty-text">No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {selectedConvo ? (
            <div className="chat-area">
              <div className="chat-header">
                <div className="chat-avatar" style={{ background: '#0088FF' }}>
                  {getInitials(getConversationName(selectedConvo))}
                </div>

                <div className="chat-info">
                  <h3 className="chat-name">{getConversationName(selectedConvo)}</h3>
                  <p className="chat-status">{getConversationRole(selectedConvo)}</p>
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
                  <img 
                    src={send}
                    className="messaging-send-img"
                    alt="Send"
                  />
                </button>
              </form>
            </div>
          ) : (
            <div className="no-chat-selected">
              <img 
                src={chatting}
                className="messaging-chat-img"
                alt="Chat"
              />

              <p className="no-chat-text">Select a conversation to start messaging</p>
            </div>
          )}
        </div>

        {/* ✅ IMPROVED MODAL */}
        {showNewConvoModal && (
          <div className="modal-overlay" onClick={() => setShowNewConvoModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">New Conversation</h2>
                <button className="modal-close" onClick={() => setShowNewConvoModal(false)}>×</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Doctor/Staff</label>
                  
                  {/* ✅ Show loading state */}
                  {loadingStaff ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      Loading staff...
                    </p>
                  ) : staff.length === 0 ? (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No staff members found. Please contact administration.
                    </p>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                    >
                      <option value="">Choose a doctor or staff member...</option>

                      {staff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.role === 'doctor' ? 'Dr. ' : ''}{s.firstName} {s.lastName}
                          {s.specialization ? ` - ${s.specialization}` : s.department ? ` - ${s.department}` : ` - ${s.role || 'Staff'}`}
                        </option>
                      ))}
                    </select>
                  )}
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
                  disabled={!selectedStaff || loadingStaff}
                >
                  Start Conversation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="nav-menu">
        <button className="nav-area active">
          <span className="nav-label">All</span>
        </button>
        
        <button className="nav-area">
          <span className="nav-label">Staff</span>
        </button>

        <button className="nav-area">
          <span className="nav-label">Doctors</span>
        </button>
      </div>
    </>
  )
}