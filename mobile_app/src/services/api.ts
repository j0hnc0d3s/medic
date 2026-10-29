// Minimal REST helper for the few calls that go through the Flask
// backend rather than straight to Firestore — mirrors web_app/frontend's
// src/services/api.js getAuthToken/apiRequest pattern.
import { auth } from './firebase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function post(endpoint: string, body: unknown) {
  return apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) })
}
