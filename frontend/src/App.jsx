import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Unauthorized from './components/Unauthorized.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'

// Staff Components

import StaffLayout from './components/StaffLayout.jsx'
import StaffView from './pages/staff/StaffView.jsx'
import StaffMessaging from './pages/staff/StaffMessaging.jsx'

// Patient Components

import PatientLayout from './components/PatientLayout.jsx'
import PatientView from './pages/patient/PatientView.jsx'
import PatientProfile from './pages/patient/PatientProfile.jsx'
import PatientAppointments from './pages/patient/PatientAppointments.jsx'
import PatientAppointment from './pages/patient/PatientAppointment.jsx'
import PatientMessaging from './pages/patient/PatientMessaging.jsx'
import PatientNotifications from './pages/patient/PatientNotifications.jsx'
import PatientCalendar from './pages/patient/PatientCalendar.jsx'

// Admin Components

import AdminLayout from './components/AdminLayout.jsx'
import AdminView from './pages/admin/AdminView.jsx'

// Index

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
          <Route path="overview" element={<StaffView />} />  
          <Route path="messaging" element={<StaffMessaging />} />
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
          <Route path="overview" element={<PatientView />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="appointment" element={<PatientAppointment />} />
          <Route path="appointment/:appointmentId/edit" element={<PatientAppointment />} />
          <Route path="messaging" element={<PatientMessaging />} />
          <Route path="notifications" element={<PatientNotifications />} />
          <Route path="calendar" element={<PatientCalendar />} />
          <Route path="profile" element={<PatientProfile />} />
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
          <Route path="overview" element={<AdminView />} />    
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App