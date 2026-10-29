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

/**
 * Note Service
 * Handles free-form clinical notes. Unlike labs/imaging, a note
 * isn't a test that needs a consultation to justify it — the
 * consultation link here is optional context, not a gate.
 */

class NoteService {
  constructor() {
    this.collectionName = 'notes'
  }

  async createNote(data) {
    try {
      const record = {
        title:        data.title || '', // usually auto-derived, e.g. "On Hypertension" — see AddNoteModal
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
        action:      'Note Added',
        description: `New note added${record.patientName ? ` for ${record.patientName}` : ''}`,
        type:        'note-added',
        user:        data.createdBy || 'Admin',
        entity:      docRef.id
      })

      return { success: true, noteId: docRef.id, message: 'Note created successfully' }
    } catch (error) {
      console.error('Create note error:', error)
      return { success: false, error: error.message }
    }
  }

  async getNote(noteId) {
    try {
      const docRef = doc(db, this.collectionName, noteId)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return { success: false, error: 'Note not found' }
      return { success: true, note: { id: docSnap.id, ...docSnap.data() } }
    } catch (error) {
      console.error('Get note error:', error)
      return { success: false, error: error.message }
    }
  }

  async getNotes(filters = {}) {
    try {
      const queryConstraints = []
      if (filters.patientId) queryConstraints.push(where('patientId', '==', filters.patientId))
      queryConstraints.push(orderBy('createdAt', 'desc'))
      if (filters.limit) queryConstraints.push(limit(filters.limit))

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const notes = []
      querySnapshot.forEach((docSnap) => notes.push({ id: docSnap.id, ...docSnap.data() }))

      return { success: true, notes, count: notes.length }
    } catch (error) {
      console.error('Get notes error:', error)
      return { success: false, error: error.message }
    }
  }

  async updateNote(noteId, updates) {
    try {
      const docRef = doc(db, this.collectionName, noteId)
      await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() })

      await activityService.logActivity({
        action:      'Note Updated',
        description: `Note updated`,
        type:        'note-updated',
        user:        updates.updatedBy || 'Admin',
        entity:      noteId
      })

      return { success: true, message: 'Note updated successfully' }
    } catch (error) {
      console.error('Update note error:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteNote(noteId) {
    try {
      const docRef = doc(db, this.collectionName, noteId)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) return { success: false, error: 'Note not found' }

      const data = docSnap.data()
      await deleteDoc(docRef)

      await activityService.logActivity({
        action:      'Note Deleted',
        description: `Note deleted: ${data.title || 'Untitled'}`,
        type:        'note-deleted',
        user:        'Admin',
        entity:      noteId
      })

      return { success: true, message: 'Note deleted successfully' }
    } catch (error) {
      console.error('Delete note error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new NoteService()
