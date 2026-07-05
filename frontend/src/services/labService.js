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
import activityService from './activityService'
import notificationService from './notificationService'

/**
 * Lab Service
 * Handles lab test/result records, linked to a patient and
 * (optionally) an uploaded document.
 */

class LabService {
  constructor() {
    this.collectionName = 'labs'
  }

  /**
   * Create a new lab record
   * @param {Object} labData
   * @returns {Promise<Object>}
   */
  async createLab(labData) {
    try {
      const data = {
        title:        labData.title || '',
        category:     labData.category || 'Other',
        status:       'requested', // 'requested' | 'completed'
        results:      labData.results || {},
        notes:        labData.notes || '',
        patientId:    labData.patientId   || null,
        patientName:  labData.patientName || '',
        // A lab is always ordered because of a specific consultation —
        // this is required at the call site (AddLabModal blocks save
        // without it), not just optional metadata.
        linkedConsultationId:   labData.linkedConsultationId   || null,
        linkedConsultationName: labData.linkedConsultationName || '',
        documentId:   labData.documentId  || null,
        fileUrl:      labData.fileUrl     || null,
        fileName:     labData.fileName    || null,
        createdAt:    Timestamp.now(),
        updatedAt:    Timestamp.now(),
        createdBy:    labData.createdBy || 'system',
        // The uid of the professional who ordered this — needed to
        // actually notify someone; createdBy above is just a display
        // name string, not enough to target a notification at.
        orderedByUid: labData.orderedByUid || null,
      }

      const docRef = await addDoc(collection(db, this.collectionName), data)

      await activityService.logActivity({
        action:      'Lab Added',
        description: `New lab added: ${data.title}${data.patientName ? ` for ${data.patientName}` : ''}`,
        type:        'lab-added',
        user:        labData.createdBy || 'Admin',
        entity:      docRef.id
      })

      await notificationService.sendLabNotification({ id: docRef.id, ...data }, 'requested')

      return {
        success: true,
        labId: docRef.id,
        message: 'Lab created successfully'
      }
    } catch (error) {
      console.error('Create lab error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get a lab record by ID
   * @param {string} labId
   * @returns {Promise<Object>}
   */
  async getLab(labId) {
    try {
      const docRef = doc(db, this.collectionName, labId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Lab not found' }
      }

      return {
        success: true,
        lab: { id: docSnap.id, ...docSnap.data() }
      }
    } catch (error) {
      console.error('Get lab error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get labs with optional filters
   * @param {Object} filters — { patientId, limit }
   * @returns {Promise<Object>}
   */
  async getLabs(filters = {}) {
    try {
      const queryConstraints = []

      if (filters.patientId) {
        queryConstraints.push(where('patientId', '==', filters.patientId))
      }

      queryConstraints.push(orderBy('createdAt', 'desc'))

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit))
      }

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const labs = []
      querySnapshot.forEach((docSnap) => {
        labs.push({ id: docSnap.id, ...docSnap.data() })
      })

      return { success: true, labs, count: labs.length }
    } catch (error) {
      console.error('Get labs error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update a lab record
   * @param {string} labId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateLab(labId, updates) {
    try {
      const docRef = doc(db, this.collectionName, labId)

      const beforeSnap = await getDoc(docRef)
      const before = beforeSnap.exists() ? beforeSnap.data() : null

      await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })

      await activityService.logActivity({
        action:      'Lab Updated',
        description: `Lab record updated`,
        type:        'lab-updated',
        user:        updates.updatedBy || 'Admin',
        entity:      labId
      })

      if (before && updates.status === 'completed' && before.status !== 'completed') {
        await notificationService.sendLabNotification({ id: labId, ...before, ...updates }, 'completed')
      }

      return { success: true, message: 'Lab updated successfully' }
    } catch (error) {
      console.error('Update lab error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a lab record
   * @param {string} labId
   * @returns {Promise<Object>}
   */
  async deleteLab(labId) {
    try {
      const docRef = doc(db, this.collectionName, labId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return { success: false, error: 'Lab not found' }
      }

      const labData = docSnap.data()
      await deleteDoc(docRef)

      await activityService.logActivity({
        action:      'Lab Deleted',
        description: `Lab deleted: ${labData.title}`,
        type:        'lab-deleted',
        user:        'Admin',
        entity:      labId
      })

      return { success: true, message: 'Lab deleted successfully' }
    } catch (error) {
      console.error('Delete lab error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new LabService()