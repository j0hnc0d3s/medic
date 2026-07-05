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
 * Appointment Service
 * Handles all appointment-related operations
 */

class AppointmentService {
  constructor() {
    this.collectionName = 'appointments'
  }

  /**
   * Create a new appointment
   * @param {Object} appointmentData 
   * @returns {Promise<Object>}
   */
  async createAppointment(appointmentData) {
    try {
      const data = {
        patientName: appointmentData.patientName,
        patientPhone: appointmentData.patientPhone || '',
        patientId: appointmentData.patientId || null,
        patientRecordId: appointmentData.patientRecordId || null,
        appointmentDate: Timestamp.fromDate(new Date(appointmentData.appointmentDate)),
        appointmentTime: appointmentData.appointmentTime,
        type: appointmentData.type || 'General Checkup',
        doctor: appointmentData.doctor || '',
        status: appointmentData.status || 'scheduled',
        notes: appointmentData.notes || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: appointmentData.createdBy || 'system',
        reminder: {
          sent: false,
          sentAt: null
        }
      }

      const docRef = await addDoc(collection(db, this.collectionName), data)

      // Log activity
      await activityService.logActivity({
        action: 'Appointment Created',
        description: `New appointment scheduled for ${appointmentData.patientName}`,
        type: 'appointment-created',
        user: appointmentData.createdBy || 'Admin',
        entity: docRef.id
      })

      return {
        success: true,
        appointmentId: docRef.id,
        message: 'Appointment created successfully'
      }
    } catch (error) {
      console.error('Create appointment error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get appointment by ID
   * @param {string} appointmentId 
   * @returns {Promise<Object>}
   */
  async getAppointment(appointmentId) {
    try {
      const docRef = doc(db, this.collectionName, appointmentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Appointment not found'
        }
      }

      return {
        success: true,
        appointment: {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
    } catch (error) {
      console.error('Get appointment error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get all appointments with optional filters
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getAppointments(filters = {}) {
    try {
      let q = collection(db, this.collectionName)
      const queryConstraints = []

      // Apply filters
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status))
      }

      if (filters.doctor) {
        queryConstraints.push(where('doctor', '==', filters.doctor))
      }

      if (filters.patientId) {
        queryConstraints.push(where('patientId', '==', filters.patientId))
      }

      if (filters.date) {
        const startDate = new Date(filters.date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(filters.date)
        endDate.setHours(23, 59, 59, 999)
        
        queryConstraints.push(where('appointmentDate', '>=', Timestamp.fromDate(startDate)))
        queryConstraints.push(where('appointmentDate', '<=', Timestamp.fromDate(endDate)))
      }

      // Always order by date
      queryConstraints.push(orderBy('appointmentDate', filters.orderBy || 'desc'))

      if (filters.limit) {
        queryConstraints.push(limit(filters.limit))
      }

      q = query(q, ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const appointments = []
      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        appointments,
        count: appointments.length
      }
    } catch (error) {
      console.error('Get appointments error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get today's appointments
   * @returns {Promise<Object>}
   */
  async getTodayAppointments() {
    const today = new Date()
    return this.getAppointments({ date: today.toISOString().split('T')[0] })
  }

  /**
   * Get upcoming appointments
   * @param {number} days - Number of days ahead
   * @returns {Promise<Object>}
   */
  async getUpcomingAppointments(days = 7) {
    try {
      const now = new Date()
      const future = new Date()
      future.setDate(future.getDate() + days)

      const q = query(
        collection(db, this.collectionName),
        where('appointmentDate', '>=', Timestamp.fromDate(now)),
        where('appointmentDate', '<=', Timestamp.fromDate(future)),
        where('status', 'in', ['scheduled', 'confirmed']),
        orderBy('appointmentDate', 'asc')
      )

      const querySnapshot = await getDocs(q)
      const appointments = []
      
      querySnapshot.forEach((doc) => {
        appointments.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        appointments,
        count: appointments.length
      }
    } catch (error) {
      console.error('Get upcoming appointments error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update appointment
   * @param {string} appointmentId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateAppointment(appointmentId, updates) {
    try {
      const docRef = doc(db, this.collectionName, appointmentId)
      
      // Get current appointment data for activity log
      const currentDoc = await getDoc(docRef)
      const currentData = currentDoc.data()

      const data = {
        ...updates,
        updatedAt: Timestamp.now()
      }

      // Convert date if provided
      if (updates.appointmentDate && !(updates.appointmentDate instanceof Timestamp)) {
        data.appointmentDate = Timestamp.fromDate(new Date(updates.appointmentDate))
      }

      await updateDoc(docRef, data)

      // Log activity if status changed
      if (updates.status && updates.status !== currentData.status) {
        await activityService.logActivity({
          action: 'Appointment Status Updated',
          description: `Status changed from ${currentData.status} to ${updates.status} for ${currentData.patientName}`,
          type: 'appointment-updated',
          user: updates.updatedBy || 'Admin',
          entity: appointmentId
        })
      }

      return {
        success: true,
        message: 'Appointment updated successfully'
      }
    } catch (error) {
      console.error('Update appointment error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update appointment status
   * @param {string} appointmentId 
   * @param {string} newStatus 
   * @returns {Promise<Object>}
   */
  async updateStatus(appointmentId, newStatus) {
    const extra = {}
    if (newStatus === 'in-progress') extra.inProgressAt = Timestamp.now()
    if (newStatus === 'completed')   extra.completedAt  = Timestamp.now()
    const result = await this.updateAppointment(appointmentId, { status: newStatus, ...extra })

    if (result.success && newStatus === 'completed') {
      const fresh = await this.getAppointment(appointmentId)
      if (fresh.success) {
        // Best-effort — billing shouldn't be able to fail the status
        // update itself, which is why this isn't awaited into the
        // main try/catch above.
        billingService.billAppointment(fresh.appointment).catch(err =>
          console.error('Auto-billing failed for appointment', appointmentId, err)
        )
      }
    }
    return result
  }

  /**
   * Cancel appointment
   * @param {string} appointmentId 
   * @param {string} reason 
   * @returns {Promise<Object>}
   */
  async cancelAppointment(appointmentId, reason = '') {
    try {
      const docRef = doc(db, this.collectionName, appointmentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Appointment not found'
        }
      }

      const appointmentData = docSnap.data()

      await updateDoc(docRef, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })

      // Log activity
      await activityService.logActivity({
        action: 'Appointment Cancelled',
        description: `Appointment cancelled for ${appointmentData.patientName}${reason ? `: ${reason}` : ''}`,
        type: 'appointment-cancelled',
        user: 'Admin',
        entity: appointmentId
      })

      return {
        success: true,
        message: 'Appointment cancelled successfully'
      }
    } catch (error) {
      console.error('Cancel appointment error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete appointment
   * @param {string} appointmentId 
   * @returns {Promise<Object>}
   */
  async deleteAppointment(appointmentId) {
    try {
      const docRef = doc(db, this.collectionName, appointmentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Appointment not found'
        }
      }

      const appointmentData = docSnap.data()

      await deleteDoc(docRef)

      // Log activity
      await activityService.logActivity({
        action: 'Appointment Deleted',
        description: `Appointment deleted for ${appointmentData.patientName}`,
        type: 'appointment-deleted',
        user: 'Admin',
        entity: appointmentId
      })

      return {
        success: true,
        message: 'Appointment deleted successfully'
      }
    } catch (error) {
      console.error('Delete appointment error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Check for appointment conflicts
   * @param {Object} appointmentData 
   * @returns {Promise<Object>}
   */
  async checkConflicts(appointmentData) {
    try {
      const appointmentDate = new Date(appointmentData.appointmentDate)
      const startOfDay = new Date(appointmentDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(appointmentDate)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
        collection(db, this.collectionName),
        where('appointmentDate', '>=', Timestamp.fromDate(startOfDay)),
        where('appointmentDate', '<=', Timestamp.fromDate(endOfDay)),
        where('doctor', '==', appointmentData.doctor),
        where('appointmentTime', '==', appointmentData.appointmentTime),
        where('status', 'in', ['scheduled', 'confirmed'])
      )

      const querySnapshot = await getDocs(q)
      const conflicts = []
      
      querySnapshot.forEach((doc) => {
        // Exclude current appointment if updating
        if (appointmentData.id && doc.id === appointmentData.id) {
          return
        }
        conflicts.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        hasConflict: conflicts.length > 0,
        conflicts
      }
    } catch (error) {
      console.error('Check conflicts error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get appointment statistics
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Today's appointments
      const todayQuery = query(
        collection(db, this.collectionName),
        where('appointmentDate', '>=', Timestamp.fromDate(today)),
        where('appointmentDate', '<', Timestamp.fromDate(tomorrow))
      )
      const todaySnapshot = await getDocs(todayQuery)

      // Upcoming appointments
      const upcomingQuery = query(
        collection(db, this.collectionName),
        where('appointmentDate', '>=', Timestamp.fromDate(today)),
        where('status', 'in', ['scheduled', 'confirmed'])
      )
      const upcomingSnapshot = await getDocs(upcomingQuery)

      // Completed this month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const completedQuery = query(
        collection(db, this.collectionName),
        where('appointmentDate', '>=', Timestamp.fromDate(firstDayOfMonth)),
        where('status', '==', 'completed')
      )
      const completedSnapshot = await getDocs(completedQuery)

      // Cancelled this month
      const cancelledQuery = query(
        collection(db, this.collectionName),
        where('appointmentDate', '>=', Timestamp.fromDate(firstDayOfMonth)),
        where('status', '==', 'cancelled')
      )
      const cancelledSnapshot = await getDocs(cancelledQuery)

      return {
        success: true,
        stats: {
          today: todaySnapshot.size,
          upcoming: upcomingSnapshot.size,
          completedThisMonth: completedSnapshot.size,
          cancelledThisMonth: cancelledSnapshot.size,
          cancellationRate: completedSnapshot.size > 0 
            ? ((cancelledSnapshot.size / (completedSnapshot.size + cancelledSnapshot.size)) * 100).toFixed(1)
            : 0
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

export default new AppointmentService()
