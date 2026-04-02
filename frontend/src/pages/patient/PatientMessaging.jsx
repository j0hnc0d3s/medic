import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import './PatientMessaging.css'

export default function Messaging() {
  const [conversations, setConversations] = useState([])
  const [selectedConvo, setSelectedConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConvo) {
      loadMessages(selectedConvo.id)
    }
  }, [selectedConvo])

  const loadConversations = async () => {
    try {
      const convoQuery = query(collection(db, 'conversations'), orderBy('lastMessageAt', 'desc'))
      const snapshot = await getDocs(convoQuery)
      const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setConversations(convos)
      if (convos.length > 0 && !selectedConvo) {
        setSelectedConvo(convos[0])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading conversations:', error)
      setLoading(false)
    }
  }

  const loadMessages = async (convoId) => {
    try {
      const msgsQuery = query(
        collection(db, 'conversations', convoId, 'messages'),
        orderBy('timestamp', 'asc')
      )
      const snapshot = await getDocs(msgsQuery)
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMessages(msgs)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvo) return

    try {
      await addDoc(collection(db, 'conversations', selectedConvo.id, 'messages'), {
        text: newMessage.trim(),
        sender: 'Admin',
        timestamp: Timestamp.now(),
        read: false
      })
      setNewMessage('')
      loadMessages(selectedConvo.id)
    } catch (error) {
      console.error('Error sending message:', error)
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
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
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Messages</h2>
            <button className="btn-icon" title="New conversation">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="conversations-list">
            {conversations.map(convo => (
              <div
                key={convo.id}
                className={`conversation-item ${selectedConvo?.id === convo.id ? 'active' : ''}`}
                onClick={() => setSelectedConvo(convo)}
              >
                <div className="convo-avatar" style={{ background: '#1F4788' }}>
                  {getInitials(convo.name)}
                </div>
                <div className="convo-content">
                  <div className="convo-header">
                    <span className="convo-name">{convo.name}</span>
                    <span className="convo-time">{formatDate(convo.lastMessageAt)}</span>
                  </div>
                  <p className="convo-preview">{convo.lastMessage}</p>
                </div>
                {convo.unread > 0 && <div className="unread-badge">{convo.unread}</div>}
              </div>
            ))}
          </div>
        </div>

        {selectedConvo ? (
          <div className="chat-area">
            <div className="chat-header">
              <div className="chat-avatar" style={{ background: '#2D9C9C' }}>
                {getInitials(selectedConvo.name)}
              </div>
              <div className="chat-info">
                <h3 className="chat-name">{selectedConvo.name}</h3>
                <p className="chat-status">{selectedConvo.status || 'Active'}</p>
              </div>
              <button className="btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  <circle cx="19" cy="12" r="1" fill="currentColor"/>
                  <circle cx="5" cy="12" r="1" fill="currentColor"/>
                </svg>
              </button>
            </div>

            <div className="messages-container">
              {messages.map((msg, index) => {
                const showDate = index === 0 || formatDate(messages[index - 1].timestamp) !== formatDate(msg.timestamp)
                return (
                  <div key={msg.id}>
                    {showDate && <div className="date-divider">{formatDate(msg.timestamp)}</div>}
                    <div className={`message ${msg.sender === 'Admin' ? 'sent' : 'received'}`}>
                      {msg.sender !== 'Admin' && (
                        <div className="message-avatar">
                          {getInitials(selectedConvo.name)}
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
            </div>

            <form className="message-input-area" onSubmit={sendMessage}>
              <button type="button" className="btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
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
    </div>
  )
}