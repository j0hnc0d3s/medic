const API_URL = import.meta.env.VITE_PUBLIC_API_URL

async function request(path) {
  const res = await fetch(`${API_URL}${path}`)
  let body = null
  try {
    body = await res.json()
  } catch {
    // non-JSON response
  }
  if (!res.ok || !body?.success) {
    const message = body?.error || `Something went wrong (${res.status}).`
    throw new Error(message)
  }
  return body.data
}

export const vitalsApi = {
  latest(entryId) {
    return request(`/api/vitals/${entryId}/latest`)
  },
  history(entryId, limit = 30) {
    return request(`/api/vitals/${entryId}/history?limit=${limit}`)
  },

  // Accepts a short queue code (e.g. A012) or a full entry id, and returns
  // { entryId, patient, queueId, room } for a known, active patient.
  async resolve(input) {
    const value = input.trim()
    if (/^[A-Za-z]\s*-?\s*\d{1,4}$/.test(value)) {
      return request(`/api/vitals/lookup?code=${encodeURIComponent(value)}`, { method: 'GET' })
    }
    const data = await request(`/api/vitals/${encodeURIComponent(value)}/latest`, { method: 'GET' })
    return { ...data, entryId: value }
  },
}
