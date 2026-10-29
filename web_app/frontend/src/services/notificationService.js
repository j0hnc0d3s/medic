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

// Every notification created goes through createNotification(), and
// every one of them is tagged with one of these categories. Settings
// toggles map 1:1 onto this list — see shouldNotify() below, which
// is what actually makes the on/off switches in Settings do anything
// instead of just being UI that nothing reads.
const CATEGORY_DEFAULTS = {
  message:     true,
  task:        true,
  appointment: true,
  lab:         true,
  system:      true, // alerts/birthdays/etc — not user-toggleable
}

class NotificationService {
  constructor() {
    this.collectionName = 'notifications'
  }

  /**
   * Check whether a user wants notifications for a given category.
   * Reads users/{uid}.notificationPreferences.{category} — missing
   * field or missing doc defaults to "on", so notifications aren't
   * silently swallowed for accounts that predate this feature.
   */
  async shouldNotify(userId, category) {
    if (!userId) return false
    if (!(category in CATEGORY_DEFAULTS)) return true // unknown category — don't silently drop it
    try {
      const userSnap = await getDoc(doc(db, 'users', userId))
      if (!userSnap.exists()) return true
      const prefs = userSnap.data().notificationPreferences || {}
      return prefs[category] !== false // only an explicit `false` opts out
    } catch (error) {
      console.error('shouldNotify check failed, defaulting to notify:', error)
      return true // fail open — a permissions hiccup shouldn't silently kill notifications
    }
  }

  /**
   * Create a notification. Respects the target user's category
   * preference automatically — callers don't need to check
   * shouldNotify() themselves before calling this.
   * @param {Object} notificationData 
   * @returns {Promise<Object>}
   */
  async createNotification(notificationData) {
    try {
      const category = notificationData.type || 'system'

      if (notificationData.userId) {
        const allowed = await this.shouldNotify(notificationData.userId, category)
        if (!allowed) {
          return { success: true, skipped: true, message: 'Notification skipped — disabled in recipient settings' }
        }
      }

      const data = {
        title: notificationData.title,
        message: notificationData.message,
        type: category,
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
   * Send appointment reminder notification — to the PATIENT.
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
   * Notify the assigned professional (doctor/nurse) that they have
   * an appointment coming up — distinct from sendAppointmentReminder
   * above, which notifies the patient. This is what NurseOverview's
   * upcoming-appointment check calls (see there for the important
   * caveat: it only fires while that professional has the app open,
   * not as a true background push — there's no scheduled job in
   * this stack yet to drive a real one).
   */
  async sendStaffAppointmentReminder(appointment, staffUserId) {
    return this.createNotification({
      title: 'Upcoming Appointment',
      message: `${appointment.patientName} at ${appointment.appointmentTime}`,
      type: 'appointment',
      userId: staffUserId,
      actionText: 'View',
      actionUrl: '/staff/appointments',
      metadata: { appointmentId: appointment.id }
    })
  }

  /**
   * Notify a professional their task is due/overdue. Same caveat as
   * sendStaffAppointmentReminder — fires on app-open, not a true
   * background push yet.
   */
  async sendTaskDueReminder(task) {
    return this.createNotification({
      title: 'Task Due',
      message: task.label,
      type: 'task',
      userId: task.userId,
      actionUrl: '/staff/overview',
      metadata: { taskId: task.id }
    })
  }

  /**
   * Notify the professional who ordered a lab that it's been
   * requested (created) or that results are in (completed).
   */
  async sendLabNotification(lab, event) {
    const targetUserId = lab.orderedByUid
    if (!targetUserId) return { success: true, skipped: true, message: 'No orderedByUid on this lab' }

    const copy = event === 'completed'
      ? { title: 'Lab Results Ready', message: `${lab.title} for ${lab.patientName} is complete.` }
      : { title: 'Lab Requested', message: `${lab.title} requested for ${lab.patientName}.` }

    return this.createNotification({
      ...copy,
      type: 'lab',
      userId: targetUserId,
      actionText: 'View',
      actionUrl: '/staff/labs',
      metadata: { labId: lab.id, event }
    })
  }

  /**
   * Notify a professional they received a message.
   */
  async sendMessageNotification({ recipientUserId, senderName, text, conversationId }) {
    return this.createNotification({
      title: `New message from ${senderName}`,
      message: text.length > 80 ? `${text.slice(0, 80)}…` : text,
      type: 'message',
      userId: recipientUserId,
      actionText: 'Reply',
      actionUrl: '/staff/messaging',
      metadata: { conversationId }
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