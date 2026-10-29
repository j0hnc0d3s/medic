import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Availability Service
 *
 * Doctor/nurse-settable weekly working hours + specific blocked
 * (vacation/unavailable) dates, used to:
 *   1. power the Availability tab (NurseAvailability.jsx) where a
 *      doctor/nurse sets their own schedule, and
 *   2. let appointmentService.checkConflicts() reject a booking
 *      outside a doctor's declared hours, not just an exact
 *      double-booked slot.
 *
 * Keyed by the doctor's display name (slugified) rather than a uid,
 * because that's the only stable identifier appointments already
 * use everywhere else (appointment.doctor is a plain "Dr. First
 * Last" string, not a uid -- see NurseAppointments.jsx) — adding a
 * uid-keyed collection here would mean two different ways to look
 * up "the same doctor" depending on which screen you're on.
 *
 * A doctor with no availability doc yet is treated as unrestricted
 * (every day, any time) rather than fully blocked, so nobody who
 * hasn't opened the new Availability tab suddenly can't be booked.
 */

const COLLECTION = 'availability'

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const slugify = (name) =>
  (name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const DEFAULT_WEEKLY_HOURS = WEEKDAYS.reduce((acc, day) => {
  acc[day] = { enabled: !['sun', 'sat'].includes(day), start: '09:00', end: '17:00' }
  return acc
}, {})

class AvailabilityService {
  /**
   * @param {string} doctorName
   * @returns {Promise<{success:boolean, configured:boolean, weeklyHours:object, blockedDates:string[], error?:string}>}
   *   `configured: false` means this doctor hasn't set anything yet —
   *   callers should treat that as unrestricted, not as "no hours".
   */
  async getAvailability(doctorName) {
    try {
      const id = slugify(doctorName)
      if (!id) return { success: true, configured: false, weeklyHours: DEFAULT_WEEKLY_HOURS, blockedDates: [] }

      const snap = await getDoc(doc(db, COLLECTION, id))
      if (!snap.exists()) {
        return { success: true, configured: false, weeklyHours: DEFAULT_WEEKLY_HOURS, blockedDates: [] }
      }
      const data = snap.data()
      return {
        success: true,
        configured: true,
        weeklyHours: { ...DEFAULT_WEEKLY_HOURS, ...(data.weeklyHours || {}) },
        blockedDates: data.blockedDates || [],
      }
    } catch (error) {
      console.error('Get availability error:', error)
      return { success: false, error: error.message, configured: false, weeklyHours: DEFAULT_WEEKLY_HOURS, blockedDates: [] }
    }
  }

  /**
   * @param {string} doctorName
   * @param {{weeklyHours: object, blockedDates: string[]}} schedule
   * @param {string} updatedBy
   */
  async setAvailability(doctorName, schedule, updatedBy) {
    try {
      const id = slugify(doctorName)
      if (!id) return { success: false, error: 'No doctor name to save availability for' }

      await setDoc(doc(db, COLLECTION, id), {
        doctorName,
        weeklyHours: schedule.weeklyHours,
        blockedDates: schedule.blockedDates || [],
        updatedAt: Timestamp.now(),
        updatedBy: updatedBy || 'unknown',
      })
      return { success: true }
    } catch (error) {
      console.error('Set availability error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Is `doctorName` declared as working at `dateStr` (YYYY-MM-DD) /
   * `timeStr` (HH:MM, 24h)? Unrestricted (no doc yet) always passes.
   */
  async isWithinAvailability(doctorName, dateStr, timeStr) {
    const res = await this.getAvailability(doctorName)
    if (!res.success || !res.configured) return { withinAvailability: true }
    if (!dateStr || !timeStr) return { withinAvailability: true }

    if ((res.blockedDates || []).includes(dateStr)) {
      return { withinAvailability: false, reason: 'blocked-date' }
    }

    const day = WEEKDAYS[new Date(`${dateStr}T00:00:00`).getDay()]
    const hours = res.weeklyHours[day]
    if (!hours || !hours.enabled) {
      return { withinAvailability: false, reason: 'day-off' }
    }
    if (timeStr < hours.start || timeStr >= hours.end) {
      return { withinAvailability: false, reason: 'outside-hours' }
    }
    return { withinAvailability: true }
  }
}

export default new AvailabilityService()
export { WEEKDAYS, DEFAULT_WEEKLY_HOURS }
