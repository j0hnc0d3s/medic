import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Pricing Service
 * A single settings/pricing doc holding { charge, cost } per billable
 * category — appointment types, lab categories, and a flat Imaging
 * rate (imaging records don't have a fixed type list the way labs
 * do, so one category covers all of them for now).
 *
 * Every value defaults to 0. Real dollar figures are not invented
 * here — admin sets them via AdminFinances' pricing editor.
 */

const DOC_PATH = ['settings', 'pricing']

const DEFAULT_PRICING = {
  appointment: {
    'General Checkup': { charge: 0, cost: 0 },
    'Follow-up':        { charge: 0, cost: 0 },
    'Emergency':        { charge: 0, cost: 0 },
    'Consultation':     { charge: 0, cost: 0 },
    'Procedure':        { charge: 0, cost: 0 },
  },
  lab: {
    'Vital Signs':  { charge: 0, cost: 0 },
    'Blood Tests':  { charge: 0, cost: 0 },
    'Urine Tests':  { charge: 0, cost: 0 },
    'Imaging':      { charge: 0, cost: 0 }, // Labs' own "Imaging" category (X-Ray/MRI/etc as a *test*)
    'Cardiac':      { charge: 0, cost: 0 },
    'Microbiology': { charge: 0, cost: 0 },
    'Other':        { charge: 0, cost: 0 },
  },
  // The separate Imaging *tab* (actual scan image uploads) — no
  // per-type breakdown since AddImagingModal's title is free text,
  // not a fixed list like labs have.
  imaging: { charge: 0, cost: 0 },
}

class PricingService {
  async getPricing() {
    try {
      const snap = await getDoc(doc(db, ...DOC_PATH))
      if (!snap.exists()) {
        return { success: true, pricing: DEFAULT_PRICING, isDefault: true }
      }
      const data = snap.data()
      // Merge over defaults so newly-added categories (e.g. a future
      // appointment type) don't come back undefined for existing docs.
      const merged = {
        appointment: { ...DEFAULT_PRICING.appointment, ...(data.appointment || {}) },
        lab:         { ...DEFAULT_PRICING.lab,         ...(data.lab || {}) },
        imaging:     { ...DEFAULT_PRICING.imaging,     ...(data.imaging || {}) },
      }
      return { success: true, pricing: merged, isDefault: false }
    } catch (error) {
      console.error('Get pricing error:', error)
      return { success: false, error: error.message, pricing: DEFAULT_PRICING }
    }
  }

  async savePricing(pricing) {
    try {
      await setDoc(doc(db, ...DOC_PATH), { ...pricing, updatedAt: Timestamp.now() })
      return { success: true }
    } catch (error) {
      console.error('Save pricing error:', error)
      return { success: false, error: error.message }
    }
  }

  /** Look up {charge, cost} for one category, falling back to zeros.
   *  Handles two shapes: category-keyed groups (appointment/lab,
   *  e.g. pricing.lab['Blood Tests']) and flat groups (imaging,
   *  which is just {charge, cost} directly since it has no fixed
   *  category list). */
  getRate(pricing, group, category) {
    const groupData = pricing?.[group]
    if (!groupData) return { charge: 0, cost: 0 }
    if ('charge' in groupData || 'cost' in groupData) return groupData
    return groupData[category] || { charge: 0, cost: 0 }
  }
}

export default new PricingService()
