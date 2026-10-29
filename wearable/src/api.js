const API_URL = import.meta.env.VITE_PUBLIC_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
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
  // Pushes one simulated/real reading for a patient channel (queueEntries id).
  push(entryId, reading) {
    return request(`/api/vitals/${entryId}`, {
      method: 'POST',
      body: JSON.stringify({ ...reading, source: 'wearable', deviceId: 'wearable-sim-01' }),
    })
  },

  // Confirms a channel id is a real, known patient before streaming to it.
  checkChannel(entryId) {
    return request(`/api/vitals/${entryId}/latest`, { method: 'GET' })
  },
}
