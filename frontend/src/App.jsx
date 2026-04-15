import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Unauthorized from './components/Unauthorized.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'

// Staff Components

import StaffLayout from './components/StaffLayout.jsx'
import StaffView from './pages/staff/StaffView.jsx'
import StaffPatients from './pages/staff/StaffPatients.jsx'
import StaffPatient from './pages/staff/StaffPatient.jsx'
import StaffAddPatient from './pages/staff/StaffAddPatient.jsx'
import StaffAppointments from './pages/staff/StaffAppointments.jsx'
import StaffAppointment from './pages/staff/StaffAppointment.jsx'
import StaffMessaging from './pages/staff/StaffMessaging.jsx'
import StaffCalendar from './pages/staff/StaffCalendar.jsx'
import StaffNotifications from './pages/staff/StaffNotifications.jsx'
import StaffProfile from './pages/staff/StaffProfile.jsx'
import StaffSettings from './pages/staff/StaffSettings.jsx'

// Patient Components

import PatientLayout from './components/PatientLayout.jsx'
import PatientView from './pages/patient/PatientView.jsx'
import PatientAppointments from './pages/patient/PatientAppointments.jsx'
import PatientAppointment from './pages/patient/PatientAppointment.jsx'
import PatientMessaging from './pages/patient/PatientMessaging.jsx'
import PatientCalendar from './pages/patient/PatientCalendar.jsx'
import PatientNotifications from './pages/patient/PatientNotifications.jsx'
import PatientProfile from './pages/patient/PatientProfile.jsx'
import PatientSettings from './pages/patient/PatientSettings.jsx'

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
          <Route path="patients" element={<StaffPatients />} />
          <Route path="patients/:patientId" element={<StaffPatient />} />
          <Route path="patients/:patientId/edit" element={<StaffAddPatient />} />
          <Route path="addpatient" element={<StaffAddPatient />} />
          <Route path="appointments" element={<StaffAppointments />} />
          <Route path="appointment" element={<StaffAppointment />} />
          <Route path="appointment/:appointmentId/edit" element={<StaffAppointment />} />
          <Route path="messaging" element={<StaffMessaging />} />
          <Route path="calendar" element={<StaffCalendar />} />
          <Route path="notifications" element={<StaffNotifications />} />
          <Route path="settings" element={<StaffSettings />} />
          <Route path="profile" element={<StaffProfile />} />
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
          <Route path="calendar" element={<PatientCalendar />} />
          <Route path="notifications" element={<PatientNotifications />} />
          <Route path="settings" element={<PatientSettings />} />
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