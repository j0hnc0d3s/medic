import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Activity Service
 * Handles audit logging and activity tracking
 */

class ActivityService {
  constructor() {
    this.collectionName = 'activities'
  }

  /**
   * Log an activity
   * @param {Object} activityData 
   * @returns {Promise<Object>}
   */
  async logActivity(activityData) {
    try {
      const data = {
        action: activityData.action,
        description: activityData.description || '',
        type: activityData.type || 'general',
        user: activityData.user || 'system',
        entity: activityData.entity || null,
        metadata: activityData.metadata || {},
        timestamp: Timestamp.now()
      }

      await addDoc(collection(db, this.collectionName), data)

      return {
        success: true
      }
    } catch (error) {
      console.error('Log activity error:', error)
      // Don't fail the main operation if logging fails
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get activities with filters
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getActivities(filters = {}) {
    try {
      const queryConstraints = []

      if (filters.type) {
        queryConstraints.push(where('type', '==', filters.type))
      }

      if (filters.user) {
        queryConstraints.push(where('user', '==', filters.user))
      }

      if (filters.entity) {
        queryConstraints.push(where('entity', '==', filters.entity))
      }

      queryConstraints.push(orderBy('timestamp', 'desc'))

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit))
      } else {
        queryConstraints.push(limit(100))
      }

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const activities = []
      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        activities,
        count: activities.length
      }
    } catch (error) {
      console.error('Get activities error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get recent activities
   * @param {number} count 
   * @returns {Promise<Object>}
   */
  async getRecentActivities(count = 20) {
    return this.getActivities({ limit: count })
  }

  /**
   * Get activities by user
   * @param {string} userId 
   * @param {number} limitCount 
   * @returns {Promise<Object>}
   */
  async getActivitiesByUser(userId, limitCount = 50) {
    return this.getActivities({ user: userId, limit: limitCount })
  }

  /**
   * Get activities by type
   * @param {string} type 
   * @param {number} limitCount 
   * @returns {Promise<Object>}
   */
  async getActivitiesByType(type, limitCount = 50) {
    return this.getActivities({ type, limit: limitCount })
  }

  /**
   * Get activities for an entity
   * @param {string} entityId 
   * @returns {Promise<Object>}
   */
  async getEntityActivities(entityId) {
    return this.getActivities({ entity: entityId, limit: 100 })
  }
}

export default new ActivityService()
