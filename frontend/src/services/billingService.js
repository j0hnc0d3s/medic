import financeService from './financeService'
import pricingService from './pricingService'

/**
 * Billing Service
 * Turns a completed appointment/lab/imaging record into two finance
 * transactions: income (what's charged to the patient) and, if the
 * category has a cost set, an expense (equipment/reagents/etc — the
 * "a consultation is profit, a lab has equipment cost" distinction).
 * Net profit per item is charge - cost, which is exactly what
 * financeService.getSummary() already computes in aggregate.
 *
 * Every call is best-effort — a billing failure should never block
 * the clinical action that triggered it (marking something complete
 * shouldn't fail because accounting hiccuped).
 */

class BillingService {
  async _recordPair({ group, category, patientId, patientName, sourceType, sourceId, createdBy }) {
    try {
      const { pricing } = await pricingService.getPricing()
      const { charge, cost } = pricingService.getRate(pricing, group, category)

      if (charge > 0) {
        await financeService.addTransaction({
          type: 'income',
          category,
          amount: charge,
          description: `${category} — ${sourceType} for ${patientName || 'patient'}`,
          patientId, patientName,
          status: 'completed',
          createdBy,
        })
      }
      if (cost > 0) {
        await financeService.addTransaction({
          type: 'expense',
          category,
          amount: cost,
          description: `Cost of ${category.toLowerCase()} — ${sourceType} (${sourceId})`,
          status: 'completed',
          createdBy,
        })
      }
      return { success: true, billed: charge > 0 || cost > 0 }
    } catch (error) {
      console.error(`Billing failed for ${sourceType} ${sourceId}:`, error)
      return { success: false, error: error.message }
    }
  }

  /** Called when an appointment reaches 'completed'. */
  async billAppointment(appointment) {
    return this._recordPair({
      group: 'appointment',
      category: appointment.type || 'General Checkup',
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      sourceType: 'appointment',
      sourceId: appointment.id,
      createdBy: appointment.updatedBy || 'system',
    })
  }

  /** Called when a lab reaches 'completed'. */
  async billLab(lab) {
    return this._recordPair({
      group: 'lab',
      category: lab.category || 'Other',
      patientId: lab.patientId,
      patientName: lab.patientName,
      sourceType: 'lab',
      sourceId: lab.id,
      createdBy: lab.updatedBy || lab.createdBy || 'system',
    })
  }

  /** Called when an imaging record is created (imaging has no
   *  separate requested/completed lifecycle the way labs do — the
   *  scan images being uploaded at all is the billable event). */
  async billImaging(imaging) {
    return this._recordPair({
      group: 'imaging',
      category: 'imaging', // flat rate — see pricingService's DEFAULT_PRICING note
      patientId: imaging.patientId,
      patientName: imaging.patientName,
      sourceType: 'imaging',
      sourceId: imaging.id,
      createdBy: imaging.createdBy || 'system',
    })
  }
}

export default new BillingService()
