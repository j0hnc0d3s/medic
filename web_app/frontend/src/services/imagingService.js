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
import billingService from './billingService'

/**
 * Imaging Service
 * Handles imaging records (X-Ray, MRI, Cardiogram, etc.) — a
 * title/description plus one or more uploaded scan images, linked
 * to a patient and (like labs) a specific consultation, since an
 * imaging study is always ordered because of one.
 */

class ImagingService {
  constructor() {
    this.collectionName = 'imaging'
  }

  async createImaging(data) {
    try {
      const record = {
        title:        data.title || '',
        description:  data.description || '',
        patientId:    data.patientId   || null,
        patientName:  data.patientName || '',
        linkedConsultationId:   data.linkedConsultationId   || null,
        linkedConsultationName: data.linkedConsultationName || '',
        images:       data.images || [], // [{ documentId, url, name }]
        createdAt:    Timestamp.now(),
        updatedAt:    Timestamp.now(),
        createdBy:    data.createdBy || 'system',
      }

      const docRef = await addDoc(collection(db, this.collectionName), record)

      await activityService.logActivity({
        action:      'Imaging Added',
        description: `New imaging added: ${record.title}${record.patientName ? ` for ${record.patientName}` : ''}`,
        type:        'imaging-added',
        user:        data.createdBy || 'Admin',
        entity:      docRef.id
      })

      billingService.billImaging({ id: docRef.id, ...record }).catch(err =>
        console.error('Auto-billing failed for imaging', docRef.id, err)
      )

      return { success: true, imagingId: docRef.id, message: 'Imaging created successfully' }
    } catch (error) {
      console.error('Create imaging error:', error)
      return { success: false, error: error.message }
    }
  }

  async getImagingRecord(imagingId) {
    try {
      const docRef = doc(db, this.collectionName, imagingId)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return { success: false, error: 'Imaging record not found' }
      return { success: true, imaging: { id: docSnap.id, ...docSnap.data() } }
    } catch (error) {
      console.error('Get imaging error:', error)
      return { success: false, error: error.message }
    }
  }

  async getImagingRecords(filters = {}) {
    try {
      const queryConstraints = []
      if (filters.patientId) queryConstraints.push(where('patientId', '==', filters.patientId))
      queryConstraints.push(orderBy('createdAt', 'desc'))
      if (filters.limit) queryConstraints.push(limit(filters.limit))

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const records = []
      querySnapshot.forEach((docSnap) => records.push({ id: docSnap.id, ...docSnap.data() }))

      return { success: true, records, count: records.length }
    } catch (error) {
      console.error('Get imaging records error:', error)
      return { success: false, error: error.message }
    }
  }

  async updateImaging(imagingId, updates) {
    try {
      const docRef = doc(db, this.collectionName, imagingId)
      await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })

      await activityService.logActivity({
        action:      'Imaging Updated',
        description: `Imaging record updated`,
        type:        'imaging-updated',
        user:        updates.updatedBy || 'Admin',
        entity:      imagingId
      })

      return { success: true, message: 'Imaging updated successfully' }
    } catch (error) {
      console.error('Update imaging error:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteImaging(imagingId) {
    try {
      const docRef = doc(db, this.collectionName, imagingId)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return { success: false, error: 'Imaging record not found' }

      const data = docSnap.data()
      await deleteDoc(docRef)

      await activityService.logActivity({
        action:      'Imaging Deleted',
        description: `Imaging deleted: ${data.title}`,
        type:        'imaging-deleted',
        user:        'Admin',
        entity:      imagingId
      })

      return { success: true, message: 'Imaging deleted successfully' }
    } catch (error) {
      console.error('Delete imaging error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new ImagingService()
