// src/services/api.js
// Helper functions for making authenticated API calls to the backend

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'

/**
 * Get the stored auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem('userToken')
}

/**
 * Get stored user data
 */
export const getUserData = () => {
  const userData = localStorage.getItem('userData')
  return userData ? JSON.parse(userData) : null
}

/**
 * Clear authentication data (for logout)
 */
export const clearAuthData = () => {
  localStorage.removeItem('userToken')
  localStorage.removeItem('userData')
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/users/me')
 * @param {object} options - Fetch options (method, body, etc.)
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  }

  // Add body if it's an object
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'API request failed')
  }

  return data
}

/**
 * GET request
 */
export const get = (endpoint) => {
  return apiRequest(endpoint, { method: 'GET' })
}

/**
 * POST request
 */
export const post = (endpoint, body) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body,
  })
}

/**
 * PUT request
 */
export const put = (endpoint, body) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body,
  })
}

/**
 * DELETE request
 */
export const del = (endpoint) => {
  return apiRequest(endpoint, { method: 'DELETE' })
}

// ========== Specific API Calls ==========

/**
 * Get current user profile
 */
export const getCurrentUser = () => {
  return get('/api/users/me')
}

/**
 * Update current user profile
 */
export const updateCurrentUser = (data) => {
  return put('/api/users/me', data)
}

/**
 * Get user role
 */
export const getUserRole = () => {
  return get('/api/users/role')
}

// ========== Staff API Calls ==========

/**
 * Get all patients (staff only)
 */
export const getAllPatients = (limit = 50) => {
  return get(`/api/staff/patients?limit=${limit}`)
}

/**
 * Get specific patient details (staff only)
 */
export const getPatientDetails = (patientId) => {
  return get(`/api/staff/patients/${patientId}`)
}

/**
 * Link a patients-collection record to a login account, by email
 * (staff only). Runs server-side via the Admin SDK — this is a
 * cross-account operation Firestore rules won't allow directly from
 * the client, so it has to go through the backend.
 */
export const linkPatientToAccount = (patientId, email) => {
  return post('/api/staff/patients/link', { patientId, email })
}

// ========== Admin API Calls ==========

/**
 * Assign role to user (admin only)
 */
export const assignUserRole = (userId, role, department = null) => {
  return put('/api/admin/users/assign-role', {
    userId,
    role,
    department,
  })
}

/**
 * Deactivate user (admin only)
 */
export const deactivateUser = (userId) => {
  return put(`/api/admin/users/deactivate/${userId}`)
}

/**
 * Activate user (admin only)
 */
export const activateUser = (userId) => {
  return put(`/api/admin/users/activate/${userId}`)
}