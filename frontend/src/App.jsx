import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Unauthorized from './components/Unauthorized.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

// Staff Components
import StaffLayout from './components/StaffLayout.jsx'
import StaffOverview from './pages/staff/StaffOverview.jsx'
/* import StaffPatients from './pages/staff/StaffPatients.jsx'
import StaffPatient from './pages/staff/StaffPatient.jsx'
import StaffMessaging from './pages/staff/StaffMessaging.jsx'
import StaffNotifications from './pages/staff/StaffNotifications.jsx'
import StaffCalendar from './pages/staff/StaffCalendar.jsx'
import StaffSettings from './pages/staff/StaffSettings.jsx'
import StaffProfile from './pages/staff/StaffProfile.jsx' */

// Patient Components
import PatientLayout from './components/PatientLayout.jsx'
import PatientOverview from './pages/patient/PatientOverview.jsx'
/* import PatientMessaging from './pages/patient/PatientMessaging.jsx'
import PatientProfile from './pages/patient/PatientProfile.jsx'
import PatientSettings from './pages/patient/PatientSettings.jsx' */

// Admin Components
import AdminLayout from './components/AdminLayout.jsx'
import AdminOverview from './pages/admin/AdminOverview.jsx'
/* import AdminFinancials from './pages/admin/AdminFinancials.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminSettings from './pages/admin/AdminSettings.jsx' */

import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ========== STAFF ROUTES ========== */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['staff', 'doctor', 'nurse', 'receptionist']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/overview" replace />} />
          <Route path="overview" element={<StaffOverview />} />
{/*           <Route path="patients" element={<StaffPatients />} />
          <Route path="patients/:patientId" element={<StaffPatient />} />
          <Route path="messaging" element={<StaffMessaging />} />
          <Route path="notifications" element={<StaffNotifications />} />
          <Route path="calendar" element={<StaffCalendar />} />
          <Route path="settings" element={<StaffSettings />} />
          <Route path="profile" element={<StaffProfile />} /> */}
        </Route>

        {/* ========== PATIENT ROUTES ========== */}
        <Route
          path="/patient/*"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/overview" replace />} />
          <Route path="overview" element={<PatientOverview />} />
{/*           <Route path="messaging" element={<PatientMessaging />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="settings" element={<PatientSettings />} /> */}
        </Route>

        {/* ========== ADMIN ROUTES ========== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
{/*           <Route path="financials" element={<AdminFinancials />} />
          <Route path="report" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} /> */}
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App