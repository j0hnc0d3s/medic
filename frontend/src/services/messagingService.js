// =========================================
// MESSAGING SERVICE
// Add to /services/messagingService.js
// =========================================

import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  query, 
  where,
  orderBy, 
  updateDoc,
  onSnapshot,
  Timestamp,
  arrayUnion 
} from 'firebase/firestore'
import { db } from './firebase'

const messagingService = {
  
  // ==========================================
  // CONVERSATIONS
  // ==========================================
  
  /**
   * Get all conversations for a user
   * @param {string} userId - Current user ID
   * @param {string} userRole - 'staff' or 'patient'
   */
  async getConversations(userId, userRole) {
    try {
      const conversationsRef = collection(db, 'conversations')
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return {
        success: true,
        conversations
      }
    } catch (error) {
      console.error('Get conversations error:', error)
      return {
        success: false,
        error: error.message,
        conversations: []
      }
    }
  },

  /**
   * Get or create a conversation between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {Object} userData - User display info
   */
  async getOrCreateConversation(userId1, userId2, userData) {
    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, 'conversations')
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId1)
      )
      
      const snapshot = await getDocs(q)
      const existingConvo = snapshot.docs.find(doc => {
        const data = doc.data()
        return data.participants.includes(userId2)
      })
      
      if (existingConvo) {
        return {
          success: true,
          conversation: {
            id: existingConvo.id,
            ...existingConvo.data()
          }
        }
      }
      
      // Create new conversation
      const newConvo = {
        participants: [userId1, userId2],
        participantDetails: {
          [userId1]: {
            name: userData.user1Name,
            role: userData.user1Role
          },
          [userId2]: {
            name: userData.user2Name,
            role: userData.user2Role
          }
        },
        lastMessage: '',
        lastMessageAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        }
      }
      
      const docRef = await addDoc(conversationsRef, newConvo)
      
      return {
        success: true,
        conversation: {
          id: docRef.id,
          ...newConvo
        }
      }
    } catch (error) {
      console.error('Get/create conversation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId) {
    try {
      const docRef = doc(db, 'conversations', conversationId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          success: true,
          conversation: {
            id: docSnap.id,
            ...docSnap.data()
          }
        }
      }
      
      return {
        success: false,
        error: 'Conversation not found'
      }
    } catch (error) {
      console.error('Get conversation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId) {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      const q = query(messagesRef, orderBy('timestamp', 'asc'))
      
      const snapshot = await getDocs(q)
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      return {
        success: true,
        messages
      }
    } catch (error) {
      console.error('Get messages error:', error)
      return {
        success: false,
        error: error.message,
        messages: []
      }
    }
  },

  /**
   * Send a message
   */
  async sendMessage(conversationId, messageData) {
    try {
      const { text, senderId, senderName, senderRole } = messageData
      
      // Add message to subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      const message = {
        text: text.trim(),
        senderId,
        senderName,
        senderRole,
        timestamp: Timestamp.now(),
        read: false
      }
      
      await addDoc(messagesRef, message)
      
      // Update conversation metadata
      const convoRef = doc(db, 'conversations', conversationId)
      const convoSnap = await getDoc(convoRef)
      const convoData = convoSnap.data()
      
      // Get the other participant ID
      const otherUserId = convoData.participants.find(id => id !== senderId)
      
      await updateDoc(convoRef, {
        lastMessage: text.trim(),
        lastMessageAt: Timestamp.now(),
        [`unreadCount.${otherUserId}`]: (convoData.unreadCount?.[otherUserId] || 0) + 1
      })
      
      return {
        success: true,
        message
      }
    } catch (error) {
      console.error('Send message error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId, userId) {
    try {
      const convoRef = doc(db, 'conversations', conversationId)
      
      await updateDoc(convoRef, {
        [`unreadCount.${userId}`]: 0
      })
      
      return {
        success: true
      }
    } catch (error) {
      console.error('Mark as read error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // ==========================================
  // REAL-TIME LISTENERS
  // ==========================================

  /**
   * Listen to conversations in real-time
   */
  listenToConversations(userId, callback) {
    try {
      const conversationsRef = collection(db, 'conversations')
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      )
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        callback(conversations)
      })
      
      return unsubscribe
    } catch (error) {
      console.error('Listen to conversations error:', error)
      return () => {} // Return empty function if error
    }
  },

  /**
   * Listen to messages in real-time
   */
  listenToMessages(conversationId, callback) {
    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages')
      const q = query(messagesRef, orderBy('timestamp', 'asc'))
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        callback(messages)
      })
      
      return unsubscribe
    } catch (error) {
      console.error('Listen to messages error:', error)
      return () => {}
    }
  },

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  /**
   * Get conversation display name for current user
   */
  getConversationDisplayName(conversation, currentUserId) {
    const otherUserId = conversation.participants.find(id => id !== currentUserId)
    const otherUserDetails = conversation.participantDetails?.[otherUserId]
    
    return otherUserDetails?.name || 'Unknown User'
  },

  /**
   * Get other participant's role
   */
  getOtherParticipantRole(conversation, currentUserId) {
    const otherUserId = conversation.participants.find(id => id !== currentUserId)
    const otherUserDetails = conversation.participantDetails?.[otherUserId]
    
    return otherUserDetails?.role || 'user'
  },

  /**
   * Get unread count for current user
   */
  getUnreadCount(conversation, currentUserId) {
    return conversation.unreadCount?.[currentUserId] || 0
  }
}

export default messagingService