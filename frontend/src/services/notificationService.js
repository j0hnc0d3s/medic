import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Notification Service
 * Handles all notification operations
 */

class NotificationService {
  constructor() {
    this.collectionName = 'notifications'
  }

  /**
   * Create a notification
   * @param {Object} notificationData 
   * @returns {Promise<Object>}
   */
  async createNotification(notificationData) {
    try {
      const data = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'system',
        userId: notificationData.userId || null,
        read: false,
        actionText: notificationData.actionText || null,
        actionUrl: notificationData.actionUrl || null,
        metadata: notificationData.metadata || {},
        createdAt: Timestamp.now(),
        readAt: null
      }

      const docRef = await addDoc(collection(db, this.collectionName), data)

      return {
        success: true,
        notificationId: docRef.id,
        message: 'Notification created successfully'
      }
    } catch (error) {
      console.error('Create notification error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get notifications with filters
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getNotifications(filters = {}) {
    try {
      const queryConstraints = []

      if (filters.userId) {
        queryConstraints.push(where('userId', '==', filters.userId))
      }

      if (filters.type) {
        queryConstraints.push(where('type', '==', filters.type))
      }

      if (filters.read !== undefined) {
        queryConstraints.push(where('read', '==', filters.read))
      }

      queryConstraints.push(orderBy('createdAt', 'desc'))

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit))
      }

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const notifications = []
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        notifications,
        count: notifications.length
      }
    } catch (error) {
      console.error('Get notifications error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get unread notifications count
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getUnreadCount(userId = null) {
    try {
      const queryConstraints = [
        where('read', '==', false)
      ]

      if (userId) {
        queryConstraints.push(where('userId', '==', userId))
      }

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      return {
        success: true,
        count: querySnapshot.size
      }
    } catch (error) {
      console.error('Get unread count error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId 
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId) {
    try {
      const docRef = doc(db, this.collectionName, notificationId)
      
      await updateDoc(docRef, {
        read: true,
        readAt: Timestamp.now()
      })

      return {
        success: true,
        message: 'Notification marked as read'
      }
    } catch (error) {
      console.error('Mark as read error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async markAllAsRead(userId = null) {
    try {
      const queryConstraints = [where('read', '==', false)]
      
      if (userId) {
        queryConstraints.push(where('userId', '==', userId))
      }

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const updatePromises = []
      querySnapshot.forEach((docSnapshot) => {
        const docRef = doc(db, this.collectionName, docSnapshot.id)
        updatePromises.push(
          updateDoc(docRef, {
            read: true,
            readAt: Timestamp.now()
          })
        )
      })

      await Promise.all(updatePromises)

      return {
        success: true,
        count: querySnapshot.size,
        message: 'All notifications marked as read'
      }
    } catch (error) {
      console.error('Mark all as read error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId 
   * @returns {Promise<Object>}
   */
  async deleteNotification(notificationId) {
    try {
      const docRef = doc(db, this.collectionName, notificationId)
      await deleteDoc(docRef)

      return {
        success: true,
        message: 'Notification deleted successfully'
      }
    } catch (error) {
      console.error('Delete notification error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Send appointment reminder notification
   * @param {Object} appointment 
   * @returns {Promise<Object>}
   */
  async sendAppointmentReminder(appointment) {
    return this.createNotification({
      title: 'Appointment Reminder',
      message: `You have an appointment with ${appointment.doctor} at ${appointment.appointmentTime}`,
      type: 'appointment',
      userId: appointment.patientId,
      actionText: 'View Details',
      actionUrl: `/appointments/${appointment.id}`,
      metadata: {
        appointmentId: appointment.id,
        appointmentDate: appointment.appointmentDate
      }
    })
  }

  /**
   * Send birthday notification
   * @param {Object} patient 
   * @returns {Promise<Object>}
   */
  async sendBirthdayNotification(patient) {
    return this.createNotification({
      title: '🎉 Happy Birthday!',
      message: `Happy birthday, ${patient.firstName}! Wishing you good health and happiness!`,
      type: 'birthday',
      userId: patient.id
    })
  }

  /**
   * Send system alert
   * @param {string} message 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async sendAlert(message, userId = null) {
    return this.createNotification({
      title: 'Alert',
      message,
      type: 'alert',
      userId
    })
  }
}

export default new NotificationService()
