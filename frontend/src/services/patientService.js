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
 * Patient Service
 * Handles patient management operations
 */

class PatientService {
  constructor() {
    this.collectionName = 'patients'
  }

  /**
   * Create a new patient
   * @param {Object} patientData 
   * @returns {Promise<Object>}
   */
  async createPatient(patientData) {
    try {
      const data = {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        fullName: `${patientData.firstName} ${patientData.lastName}`,
        email: (patientData.email || '').toLowerCase(),
        phone: patientData.phone || '',
        dateOfBirth: patientData.dateOfBirth ? Timestamp.fromDate(new Date(patientData.dateOfBirth)) : null,
        gender: patientData.gender || '',
        address: patientData.address || '',
        emergencyContact: {
          name: patientData.emergencyContactName || '',
          phone: patientData.emergencyContactPhone || '',
          relationship: patientData.emergencyContactRelationship || ''
        },
        bloodType: patientData.bloodType || '',
        allergies: patientData.allergies || [],
        medications: patientData.medications || [],
        medicalHistory: patientData.medicalHistory || [],
        insurance: {
          provider: patientData.insuranceProvider || '',
          policyNumber: patientData.insurancePolicyNumber || '',
          groupNumber: patientData.insuranceGroupNumber || ''
        },
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: patientData.createdBy || 'system'
      }

      const docRef = await addDoc(collection(db, this.collectionName), data)

      // Log activity
      await activityService.logActivity({
        action: 'Patient Added',
        description: `New patient registered: ${data.fullName}`,
        type: 'patient-added',
        user: patientData.createdBy || 'Admin',
        entity: docRef.id
      })

      return {
        success: true,
        patientId: docRef.id,
        message: 'Patient created successfully'
      }
    } catch (error) {
      console.error('Create patient error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get patient by ID
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  async getPatient(patientId) {
    try {
      const docRef = doc(db, this.collectionName, patientId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Patient not found'
        }
      }

      return {
        success: true,
        patient: {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
    } catch (error) {
      console.error('Get patient error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get all patients with optional filters
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getPatients(filters = {}) {
    try {
      let q = collection(db, this.collectionName)
      const queryConstraints = []

      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status))
      }

      queryConstraints.push(orderBy('createdAt', 'desc'))

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit))
      }

      if (queryConstraints.length > 0) {
        q = query(q, ...queryConstraints)
      }

      const querySnapshot = await getDocs(q)
      const patients = []

      querySnapshot.forEach((doc) => {
        patients.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        patients,
        count: patients.length
      }
    } catch (error) {
      console.error('Get patients error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Search patients by name, email, or phone
   * @param {string} searchTerm 
   * @returns {Promise<Object>}
   */
  async searchPatients(searchTerm) {
    try {
      const allPatients = await this.getPatients()
      
      if (!allPatients.success) {
        return allPatients
      }

      const term = searchTerm.toLowerCase()
      const filtered = allPatients.patients.filter(patient => 
        patient.fullName?.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term) ||
        patient.phone?.includes(term)
      )

      return {
        success: true,
        patients: filtered,
        count: filtered.length
      }
    } catch (error) {
      console.error('Search patients error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update patient
   * @param {string} patientId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updatePatient(patientId, updates) {
    try {
      const docRef = doc(db, this.collectionName, patientId)
      
      const data = {
        ...updates,
        updatedAt: Timestamp.now()
      }

      // Update full name if first or last name changed
      if (updates.firstName || updates.lastName) {
        const currentDoc = await getDoc(docRef)
        const currentData = currentDoc.data()
        data.fullName = `${updates.firstName || currentData.firstName} ${updates.lastName || currentData.lastName}`
      }

      // Convert date of birth if provided
      if (updates.dateOfBirth && !(updates.dateOfBirth instanceof Timestamp)) {
        data.dateOfBirth = Timestamp.fromDate(new Date(updates.dateOfBirth))
      }

      // Keep email casing consistent with users.email (auth.py lowercases on register)
      if (updates.email) {
        data.email = updates.email.toLowerCase()
      }

      await updateDoc(docRef, data)

      // Log activity
      await activityService.logActivity({
        action: 'Patient Updated',
        description: `Patient information updated`,
        type: 'patient-updated',
        user: updates.updatedBy || 'Admin',
        entity: patientId
      })

      return {
        success: true,
        message: 'Patient updated successfully'
      }
    } catch (error) {
      console.error('Update patient error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get a patient record by email — used to find a walk-in/staff-created
   * record that belongs to someone who has since made (or already has)
   * a login account, when no direct link exists yet.
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async getPatientByEmail(email) {
    try {
      if (!email) return { success: false, error: 'Email is required' }

      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email.toLowerCase()),
        limit(5)
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return { success: true, patient: null }
      }

      const matches = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }))

      return {
        success: true,
        patient: matches[0],
        // Surfaced so callers can warn staff instead of silently
        // picking one when there's an unresolved duplicate.
        ambiguous: matches.length > 1,
        matches
      }
    } catch (error) {
      console.error('Get patient by email error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Link a patients-collection record to a real login account (users/{uid}).
   * Writes both directions: linkedUserId on the patient doc, and
   * patientRecordId on the user doc, so either side can look the other up.
   * @param {string} patientId 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async linkToUser(patientId, userId) {
    try {
      await updateDoc(doc(db, this.collectionName, patientId), {
        linkedUserId: userId,
        updatedAt: Timestamp.now()
      })
      await updateDoc(doc(db, 'users', userId), {
        patientRecordId: patientId
      })

      await activityService.logActivity({
        action: 'Patient Record Linked',
        description: `Patient record ${patientId} linked to user account ${userId}`,
        type: 'patient-linked',
        user: 'Admin',
        entity: patientId
      })

      return {
        success: true,
        message: 'Patient record linked successfully'
      }
    } catch (error) {
      console.error('Link patient to user error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete patient
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  async deletePatient(patientId) {
    try {
      const docRef = doc(db, this.collectionName, patientId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Patient not found'
        }
      }

      const patientData = docSnap.data()
      await deleteDoc(docRef)

      // Log activity
      await activityService.logActivity({
        action: 'Patient Deleted',
        description: `Patient record deleted: ${patientData.fullName}`,
        type: 'patient-deleted',
        user: 'Admin',
        entity: patientId
      })

      return {
        success: true,
        message: 'Patient deleted successfully'
      }
    } catch (error) {
      console.error('Delete patient error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get patient statistics
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    try {
      const allPatients = await this.getPatients()
      
      if (!allPatients.success) {
        return allPatients
      }

      const active = allPatients.patients.filter(p => p.status === 'active').length
      const inactive = allPatients.patients.filter(p => p.status === 'inactive').length

      // Calculate age distribution
      const ageGroups = {
        '0-17': 0,
        '18-35': 0,
        '36-50': 0,
        '51-65': 0,
        '65+': 0
      }

      allPatients.patients.forEach(patient => {
        if (patient.dateOfBirth) {
          const dob = patient.dateOfBirth.toDate()
          const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000))
          
          if (age < 18) ageGroups['0-17']++
          else if (age < 36) ageGroups['18-35']++
          else if (age < 51) ageGroups['36-50']++
          else if (age < 66) ageGroups['51-65']++
          else ageGroups['65+']++
        }
      })

      return {
        success: true,
        stats: {
          total: allPatients.count,
          active,
          inactive,
          ageGroups
        }
      }
    } catch (error) {
      console.error('Get patient statistics error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new PatientService()