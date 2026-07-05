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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { db, storage } from './firebase'
import activityService from './activityService'

/**
 * Document Service
 * Handles document management and file storage
 */

class DocumentService {
  constructor() {
    this.collectionName = 'documents'
  }

  /**
   * Upload a document
   * @param {File} file 
   * @param {Object} metadata 
   * @returns {Promise<Object>}
   */
  async uploadDocument(file, metadata) {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${timestamp}_${file.name}`
      const storageRef = ref(storage, `documents/${filename}`)

      // Upload file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Create document record in Firestore
      const data = {
        name: metadata.name || file.name,
        type: metadata.type || this.getFileType(file.name),
        category: metadata.category || 'Other',
        description: metadata.description || '',
        patientId: metadata.patientId || null,
        patientName: metadata.patientName || '',
        fileName: file.name,
        fileSize: file.size,
        size: this.formatFileSize(file.size),
        mimeType: file.type,
        url: downloadURL,
        storagePath: `documents/${filename}`,
        uploadedBy: metadata.uploadedBy || 'Admin',
        uploadedAt: Timestamp.now(),
        metadata: metadata.metadata || {}
      }

      const docRef = await addDoc(collection(db, this.collectionName), data)

      // Log activity
      await activityService.logActivity({
        action: 'Document Uploaded',
        description: `File uploaded: ${data.name}`,
        type: 'file-uploaded',
        user: metadata.uploadedBy || 'Admin',
        entity: docRef.id
      })

      return {
        success: true,
        documentId: docRef.id,
        url: downloadURL,
        message: 'Document uploaded successfully'
      }
    } catch (error) {
      console.error('Upload document error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get document by ID
   * @param {string} documentId 
   * @returns {Promise<Object>}
   */
  async getDocument(documentId) {
    try {
      const docRef = doc(db, this.collectionName, documentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Document not found'
        }
      }

      return {
        success: true,
        document: {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
    } catch (error) {
      console.error('Get document error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get documents with filters
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getDocuments(filters = {}) {
    try {
      const queryConstraints = []

      if (filters.type) {
        queryConstraints.push(where('type', '==', filters.type))
      }

      if (filters.category) {
        queryConstraints.push(where('category', '==', filters.category))
      }

      if (filters.uploadedBy) {
        queryConstraints.push(where('uploadedBy', '==', filters.uploadedBy))
      }

      if (filters.patientId) {
        queryConstraints.push(where('patientId', '==', filters.patientId))
      }

      queryConstraints.push(orderBy('uploadedAt', 'desc'))

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit))
      }

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const documents = []
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        documents,
        count: documents.length
      }
    } catch (error) {
      console.error('Get documents error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Search documents
   * @param {string} searchTerm 
   * @returns {Promise<Object>}
   */
  async searchDocuments(searchTerm) {
    try {
      const allDocuments = await this.getDocuments()
      
      if (!allDocuments.success) {
        return allDocuments
      }

      const term = searchTerm.toLowerCase()
      const filtered = allDocuments.documents.filter(doc => 
        doc.name?.toLowerCase().includes(term) ||
        doc.category?.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term)
      )

      return {
        success: true,
        documents: filtered,
        count: filtered.length
      }
    } catch (error) {
      console.error('Search documents error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update document metadata
   * @param {string} documentId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateDocument(documentId, updates) {
    try {
      const docRef = doc(db, this.collectionName, documentId)
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })

      return {
        success: true,
        message: 'Document updated successfully'
      }
    } catch (error) {
      console.error('Update document error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete document
   * @param {string} documentId 
   * @returns {Promise<Object>}
   */
  async deleteDocument(documentId) {
    try {
      // Get document data
      const docRef = doc(db, this.collectionName, documentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Document not found'
        }
      }

      const documentData = docSnap.data()

      // Delete file from storage
      if (documentData.storagePath) {
        const storageRef = ref(storage, documentData.storagePath)
        await deleteObject(storageRef)
      }

      // Delete document record
      await deleteDoc(docRef)

      // Log activity
      await activityService.logActivity({
        action: 'Document Deleted',
        description: `File deleted: ${documentData.name}`,
        type: 'file-deleted',
        user: 'Admin',
        entity: documentId
      })

      return {
        success: true,
        message: 'Document deleted successfully'
      }
    } catch (error) {
      console.error('Delete document error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get file type from filename
   * @param {string} filename 
   * @returns {string}
   */
  getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase()
    
    if (['pdf'].includes(extension)) return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image'
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'document'
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'spreadsheet'
    
    return 'other'
  }

  /**
   * Format file size
   * @param {number} bytes 
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    try {
      const allDocuments = await this.getDocuments()
      
      if (!allDocuments.success) {
        return allDocuments
      }

      const totalSize = allDocuments.documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
      const typeCount = {}
      
      allDocuments.documents.forEach(doc => {
        typeCount[doc.type] = (typeCount[doc.type] || 0) + 1
      })

      return {
        success: true,
        stats: {
          total: allDocuments.count,
          totalSize: this.formatFileSize(totalSize),
          totalSizeBytes: totalSize,
          byType: typeCount
        }
      }
    } catch (error) {
      console.error('Get statistics error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new DocumentService()
