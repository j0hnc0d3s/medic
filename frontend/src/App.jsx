import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import Unauthorized from './components/Unauthorized.jsx'
import Login from './pages/auth/Login.jsx'

// Index
import './index.css'

// Staff
import NurseOverview from './pages/staff/NurseOverview.jsx'
/* import NurseMessaging from './pages/staff/NurseMessaging.jsx'
import NurseNotes from './pages/staff/NurseNotes.jsx'
import NurseDocuments from './pages/staff/NurseDocuments.jsx'
import NurseAppointments from './pages/staff/NurseAppointments.jsx'
import NursePatients from './pages/staff/NursePatients.jsx'
import NurseImaging from './pages/staff/NurseImaging.jsx'
import NurseLabs from './pages/staff/NurseLabs.jsx' */

// Patient
import PatientOverview from './pages/patient/PatientOverview.jsx'
/* import PatientMessaging from './pages/patient/PatientMessaging.jsx'
import PatientDocuments from './pages/patient/PatientDocuments.jsx'
import PatientAppointments from './pages/patient/PatientAppointments.jsx' */

// Admin
import AdminOverview from './pages/admin/AdminOverview.jsx'
/* import AdminFinances from './pages/admin/AdminFinances.jsx'
import AdminPatients from './pages/admin/AdminPatients.jsx'
import AdminMessaging from './pages/admin/AdminMessaging.jsx' */

// Display
import QueueDisplay from './display/QueueDisplay.jsx'

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
        <Route path="/display" element={<QueueDisplay />} />

        {/* ========== STAFF ROUTES ========== */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['staff', 'doctor', 'nurse', 'receptionist']}>
              <StaffOutlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/overview" replace />} />
          <Route path="overview" element={<NurseOverview />} />
{/*           <Route path="patients" element={<NursePatients />} />
          <Route path="messaging" element={<NurseMessaging />} />
          <Route path="appointments" element={<NurseAppointments />} />
          <Route path="notes" element={<NurseNotes />} />
          <Route path="documents" element={<NurseDocuments />} />
          <Route path="imaging" element={<NurseImaging />} />
          <Route path="labs" element={<NurseLabs />} /> */}

          {/* Doctors also get access to the patients directory, per the
              AdminPatients page being shared between admin + doctor roles */}
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
{/*           <Route path="appointments" element={<PatientAppointments />} />
          <Route path="documents" element={<PatientDocuments />} />
          <Route path="messaging" element={<PatientMessaging />} /> */}
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
{/*           <Route path="patients" element={<AdminPatients />} />
          <Route path="finances" element={<AdminFinances />} />
          <Route path="messages" element={<AdminMessaging />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App