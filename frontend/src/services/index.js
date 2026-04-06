/**
 * Medic-Private Services
 * Centralized export for all backend services
 */

export { default as authService } from './authService'
export { default as appointmentService } from './appointmentService'
export { default as patientService } from './patientService'
export { default as staffService } from './staffService'
export { default as notificationService } from './notificationService'
export { default as documentService } from './documentService'
export { default as activityService } from './activityService'
export { default as messagingService } from './messagingService'
export { default as financeService } from './financeService'
export { default as reportService } from './reportService'

// Firebase exports
export { db, auth, storage, functions } from './firebase'
