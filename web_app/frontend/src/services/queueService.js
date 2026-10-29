import { auth } from './firebase'

/**
 * Queue Service
 * queueEntries isn't accessed via the client Firestore SDK like
 * everything else in this app — it only exists behind the Flask
 * /api/queue/* routes (auth_required + staff_required), so every
 * method here is a fetch with a Firebase ID token attached, not a
 * Firestore query.
 */

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'

async function authedFetch(path, options = {}) {
  const token = await auth.currentUser?.getIdToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data.data
}

class QueueService {
  /** Live queue — queued/called/in_progress only. */
  async getQueue() {
    try {
      const data = await authedFetch('/api/queue')
      return { success: true, ...data }
    } catch (error) {
      console.error('Get queue error:', error)
      return { success: false, error: error.message, entries: [] }
    }
  }

  /**
   * Completed queue entries for a given day, with wait/service/total
   * duration already computed server-side (queuedAt/calledAt/completedAt
   * live in Firestore as real Timestamps — computing durations here
   * would mean parsing ISO strings the backend already parsed once).
   * @param {string} [dateStr] - 'YYYY-MM-DD', defaults to today (UTC)
   */
  async getHistory(dateStr = null) {
    try {
      const qs = dateStr ? `?date=${dateStr}` : ''
      const data = await authedFetch(`/api/queue/history${qs}`)
      return { success: true, ...data }
    } catch (error) {
      console.error('Get queue history error:', error)
      return { success: false, error: error.message, entries: [], summary: null }
    }
  }

  async updateStatus(entryId, status) {
    try {
      const data = await authedFetch(`/api/queue/${entryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      return { success: true, ...data }
    } catch (error) {
      console.error('Update queue status error:', error)
      return { success: false, error: error.message }
    }
  }

  async updateTriage(entryId, updates) {
    try {
      const data = await authedFetch(`/api/queue/${entryId}/triage`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return { success: true, ...data }
    } catch (error) {
      console.error('Update triage error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default new QueueService()
