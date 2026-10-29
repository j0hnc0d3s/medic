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
    // non-JSON response, fall through with body = null
  }
  if (!res.ok || !body?.success) {
    const message = body?.error || `Something went wrong (${res.status}). Please try again.`
    throw new Error(message)
  }
  return body.data
}

export const queueApi = {
  // Submits the intake form. Backend emails a 6-digit code and creates a
  // pending_verification queueEntries doc; returns { queueEntryId, emailSent }.
  join(payload) {
    return request('/api/queue/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // Confirms the emailed 6-digit code, assigns a queue number, flips the
  // entry to "queued". Returns the public queue view (queueId, peopleAhead, etc.)
  verifyCode(code) {
    return request('/api/queue/verify-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },

  // Looks up active queue entries by full name + date of birth + phone —
  // the three fields the backend can match without a code.
  find({ name, dob, phone }) {
    return request('/api/queue/find', {
      method: 'POST',
      body: JSON.stringify({ name, dob, phone }),
    })
  },

  // Live poll for a single entry's position (people ahead, est. wait).
  status(entryId) {
    return request(`/api/queue/status/${entryId}`, { method: 'GET' })
  },
}
