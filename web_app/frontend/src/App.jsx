import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import Unauthorized from './components/Unauthorized.jsx'
import Login from './pages/auth/Login.jsx'
import './index.css'

// Staff

import NurseOverview from './pages/staff/NurseOverview.jsx'
import NursePatients from './pages/staff/NursePatients.jsx'
import NurseLabs from './pages/staff/NurseLabs.jsx'
import NurseAppointments from './pages/staff/NurseAppointments.jsx'
import NurseNotes from './pages/staff/NurseNotes.jsx'
import NurseDocuments from './pages/staff/NurseDocuments.jsx'
import NurseImaging from './pages/staff/NurseImaging.jsx'
import NurseMessaging from './pages/staff/NurseMessaging.jsx'
import NurseSettings from './pages/staff/NurseSettings.jsx'
import NurseNotifications from './pages/staff/NurseNotifications.jsx'
import NurseAvailability from './pages/staff/NurseAvailability.jsx'

// Triage (TriageNurse role -- same Nurse*.jsx pages above, plus this)
import TriageVitals from './pages/triage/TriageVitals.jsx'

// Reception (receptionist role -- its own narrower page set)
import StaffOverview from './pages/reception/StaffOverview.jsx'
import StaffPatients from './pages/reception/StaffPatients.jsx'
import StaffAppointments from './pages/reception/StaffAppointments.jsx'
import StaffSettings from './pages/reception/StaffSettings.jsx'

/* 

*/

// Patient

import PatientOverview from './pages/patient/PatientOverview.jsx'

import PatientMessaging from './pages/patient/PatientMessaging.jsx'
import PatientDocuments from './pages/patient/PatientDocuments.jsx'
import PatientAppointments from './pages/patient/PatientAppointments.jsx'
import PatientSettings from './pages/patient/PatientSettings.jsx'
import PatientNotifications from './pages/patient/PatientNotifications.jsx'

// Admin

import AdminOverview from './pages/admin/AdminOverview.jsx'
import AdminFinances from './pages/admin/AdminFinances.jsx'
import AdminPatients from './pages/admin/AdminPatients.jsx'
import AdminSettings from './pages/admin/AdminSettings.jsx'
import AdminNotifications from './pages/admin/AdminNotifications.jsx'

/* General */

function StaffOutlet() {
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ========== STAFF ROUTES ========== */}
        <Route
          path="/staff/*"
          element={
            // 'triage' included so TriageNurse can use these same
            // Nurse*.jsx pages (doctor/nurse parity) -- see
            // pages/staff/NurseSidebar.jsx for the extra Vitals tab
            // that shows only when the signed-in user is 'triage'.
            // 'receptionist' is NOT here -- it gets its own, narrower
            // page set under /reception/* below.
            <ProtectedRoute allowedRoles={['staff', 'doctor', 'nurse', 'triage']}>
              <StaffOutlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/overview" replace />} />
          <Route path="overview" element={<NurseOverview />} />
          <Route path="patients" element={<NursePatients />} />
          <Route path="labs" element={<NurseLabs />} />
          <Route path="appointments" element={<NurseAppointments />} />
          <Route path="notes" element={<NurseNotes />} />
          <Route path="documents" element={<NurseDocuments />} />
          <Route path="imaging" element={<NurseImaging />} />
          <Route path="messaging" element={<NurseMessaging />} />
          <Route path="settings" element={<NurseSettings />} />
          <Route path="notifications" element={<NurseNotifications />} />
          <Route path="availability" element={<NurseAvailability />} />
        </Route>

        {/* ========== TRIAGE ROUTES ========== */}
        {/* TriageNurse-only extra: live wearable vitals for everyone in
            the queue, plus a link out to the standalone bedside_monitor
            app. Everything else TriageNurse needs lives under /staff/*
            above, which now allows the 'triage' role too. */}
        <Route
          path="/triage/*"
          element={
            <ProtectedRoute allowedRoles={['triage']}>
              <StaffOutlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/triage/vitals" replace />} />
          <Route path="vitals" element={<TriageVitals />} />
        </Route>

        {/* ========== RECEPTION ROUTES ========== */}
        {/* Receptionist's own, narrower page set: patient lookup,
            appointments/booking, doctor availability. Settings is
            reused straight from NurseSettings.jsx since there's
            nothing role-specific about a password-change screen. */}
        <Route
          path="/reception/*"
          element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <StaffOutlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/reception/overview" replace />} />
          <Route path="overview" element={<StaffOverview />} />
          <Route path="patients" element={<StaffPatients />} />
          <Route path="appointments" element={<StaffAppointments />} />
          <Route path="settings" element={<StaffSettings />} />
        </Route>

        {/* ========== PATIENT ROUTES ========== */}
        <Route
          path="/patient/*"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <StaffOutlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/overview" replace />} />
          <Route path="overview" element={<PatientOverview />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="documents" element={<PatientDocuments />} />
          <Route path="messaging" element={<PatientMessaging />} />
          <Route path="settings" element={<PatientSettings />} />
          <Route path="notifications" element={<PatientNotifications />} />
        </Route>

        {/* ========== ADMIN ROUTES ========== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StaffOutlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="finances" element={<AdminFinances />} />
          <Route path="patients" element={<AdminPatients />} />
          {/* No messaging route here on purpose -- Admin is HR/finance-facing
              (finances, patient records) and deliberately has no direct
              patient-messaging capability. See AdminSettings/AdminPatients
              for what Admin keeps. */}
          <Route path="settings" element={<AdminSettings />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App