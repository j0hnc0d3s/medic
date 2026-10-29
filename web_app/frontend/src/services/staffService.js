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
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import activityService from './activityService'

/**
 * Staff Service
 * Handles staff management operations
 */

class StaffService {
  constructor() {
    this.collectionName = 'staff'
  }

  /**
   * Add a new staff member
   * @param {Object} staffData 
   * @returns {Promise<Object>}
   */
  async addStaff(staffData) {
    try {
      const data = {
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        fullName: `${staffData.firstName} ${staffData.lastName}`,
        email: staffData.email || '',
        phone: staffData.phone || '',
        role: staffData.role || 'Staff',
        department: staffData.department || '',
        specialization: staffData.specialization || '',
        status: staffData.status || 'active',
        shift: staffData.shift || 'day',
        employeeId: staffData.employeeId || null,
        hireDate: staffData.hireDate ? Timestamp.fromDate(new Date(staffData.hireDate)) : null,
        salary: staffData.salary || 0,
        qualifications: staffData.qualifications || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, this.collectionName), data)

      // Log activity
      await activityService.logActivity({
        action: 'Staff Added',
        description: `New staff member added: ${data.fullName} (${data.role})`,
        type: 'staff-added',
        user: staffData.createdBy || 'Admin',
        entity: docRef.id
      })

      return {
        success: true,
        staffId: docRef.id,
        message: 'Staff member added successfully'
      }
    } catch (error) {
      console.error('Add staff error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get staff by ID
   * @param {string} staffId 
   * @returns {Promise<Object>}
   */
  async getStaff(staffId) {
    try {
      const docRef = doc(db, this.collectionName, staffId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Staff member not found'
        }
      }

      return {
        success: true,
        staff: {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
    } catch (error) {
      console.error('Get staff error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get all staff with optional filters
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getAllStaff(filters = {}) {
    try {
      const queryConstraints = []

      if (filters.role) {
        queryConstraints.push(where('role', '==', filters.role))
      }

      if (filters.department) {
        queryConstraints.push(where('department', '==', filters.department))
      }

      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status))
      }

      queryConstraints.push(orderBy('createdAt', 'desc'))

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const staff = []
      querySnapshot.forEach((doc) => {
        staff.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        staff,
        count: staff.length
      }
    } catch (error) {
      console.error('Get all staff error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update staff member
   * @param {string} staffId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateStaff(staffId, updates) {
    try {
      const docRef = doc(db, this.collectionName, staffId)
      
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

      // Convert hire date if provided
      if (updates.hireDate && !(updates.hireDate instanceof Timestamp)) {
        data.hireDate = Timestamp.fromDate(new Date(updates.hireDate))
      }

      await updateDoc(docRef, data)

      // Log activity
      await activityService.logActivity({
        action: 'Staff Updated',
        description: `Staff information updated`,
        type: 'staff-updated',
        user: updates.updatedBy || 'Admin',
        entity: staffId
      })

      return {
        success: true,
        message: 'Staff member updated successfully'
      }
    } catch (error) {
      console.error('Update staff error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete staff member
   * @param {string} staffId 
   * @returns {Promise<Object>}
   */
  async deleteStaff(staffId) {
    try {
      const docRef = doc(db, this.collectionName, staffId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Staff member not found'
        }
      }

      const staffData = docSnap.data()
      await deleteDoc(docRef)

      // Log activity
      await activityService.logActivity({
        action: 'Staff Deleted',
        description: `Staff member deleted: ${staffData.fullName}`,
        type: 'staff-deleted',
        user: 'Admin',
        entity: staffId
      })

      return {
        success: true,
        message: 'Staff member deleted successfully'
      }
    } catch (error) {
      console.error('Delete staff error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get staff statistics
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    try {
      const allStaff = await this.getAllStaff()
      
      if (!allStaff.success) {
        return allStaff
      }

      const byRole = {}
      const byStatus = {}
      
      allStaff.staff.forEach(member => {
        byRole[member.role] = (byRole[member.role] || 0) + 1
        byStatus[member.status] = (byStatus[member.status] || 0) + 1
      })

      return {
        success: true,
        stats: {
          total: allStaff.count,
          byRole,
          byStatus,
          active: byStatus.active || 0,
          onLeave: byStatus['on-leave'] || 0
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

export default new StaffService()
