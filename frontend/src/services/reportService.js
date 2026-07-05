import appointmentService from './appointmentService'
import patientService from './patientService'
import staffService from './staffService'
import financeService from './financeService'

/**
 * Report Service
 * Generates reports and analytics
 */

class ReportService {
  /**
   * Generate dashboard summary
   * @returns {Promise<Object>}
   */
  async getDashboardSummary() {
    try {
      const [appointments, patients, staff, finances] = await Promise.all([
        appointmentService.getStatistics(),
        patientService.getStatistics(),
        staffService.getStatistics(),
        financeService.getSummary()
      ])

      return {
        success: true,
        summary: {
          appointments: appointments.success ? appointments.stats : {},
          patients: patients.success ? patients.stats : {},
          staff: staff.success ? staff.stats : {},
          finances: finances.success ? finances.summary : {}
        }
      }
    } catch (error) {
      console.error('Get dashboard summary error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate financial report
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getFinancialReport(filters = {}) {
    try {
      const summary = await financeService.getSummary(filters)
      const transactions = await financeService.getTransactions(filters)

      return {
        success: true,
        report: {
          summary: summary.success ? summary.summary : {},
          transactions: transactions.success ? transactions.transactions : [],
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Get financial report error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate appointment report
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getAppointmentReport(filters = {}) {
    try {
      const [appointments, stats] = await Promise.all([
        appointmentService.getAppointments(filters),
        appointmentService.getStatistics()
      ])

      return {
        success: true,
        report: {
          appointments: appointments.success ? appointments.appointments : [],
          statistics: stats.success ? stats.stats : {},
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Get appointment report error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate patient demographics report
   * @returns {Promise<Object>}
   */
  async getPatientDemographics() {
    try {
      const stats = await patientService.getStatistics()

      return {
        success: true,
        report: {
          statistics: stats.success ? stats.stats : {},
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Get patient demographics error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate staff report
   * @returns {Promise<Object>}
   */
  async getStaffReport() {
    try {
      const [allStaff, stats] = await Promise.all([
        staffService.getAllStaff(),
        staffService.getStatistics()
      ])

      return {
        success: true,
        report: {
          staff: allStaff.success ? allStaff.staff : [],
          statistics: stats.success ? stats.stats : {},
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Get staff report error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate custom report
   * @param {Object} config 
   * @returns {Promise<Object>}
   */
  async generateCustomReport(config) {
    try {
      const reportData = {}

      if (config.includeAppointments) {
        const appointments = await appointmentService.getAppointments(config.filters || {})
        reportData.appointments = appointments.success ? appointments.appointments : []
      }

      if (config.includeFinances) {
        const finances = await financeService.getSummary(config.filters || {})
        reportData.finances = finances.success ? finances.summary : {}
      }

      if (config.includePatients) {
        const patients = await patientService.getStatistics()
        reportData.patients = patients.success ? patients.stats : {}
      }

      if (config.includeStaff) {
        const staff = await staffService.getStatistics()
        reportData.staff = staff.success ? staff.stats : {}
      }

      return {
        success: true,
        report: {
          ...reportData,
          config,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Generate custom report error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new ReportService()
