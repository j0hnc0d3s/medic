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
}
