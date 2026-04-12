import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Unauthorized from './components/Unauthorized.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'

// Staff Components

import StaffLayout from './components/StaffLayout.jsx'
import StaffOverview from './pages/staff/StaffOverview.jsx'
/* import StaffPatients from './pages/staff/StaffPatients.jsx'
import StaffPatient from './pages/staff/StaffPatient.jsx'
import StaffAddPatient from './pages/staff/StaffAddPatient.jsx'
import StaffNotifications from './pages/staff/StaffNotifications.jsx'
import StaffCalendar from './pages/staff/StaffCalendar.jsx'
import StaffDocuments from './pages/staff/StaffDocuments.jsx' */
import StaffMessaging from './pages/staff/StaffMessaging.jsx'

/* 
import StaffProfile from './pages/staff/StaffProfile.jsx'
*/

// Patient Components

import PatientLayout from './components/PatientLayout.jsx'
import PatientOverview from './pages/patient/PatientOverview.jsx'
import PatientAppointment from './pages/patient/PatientAppointment.jsx'
import PatientMessaging from './pages/patient/PatientMessaging.jsx'
import PatientNotifications from './pages/patient/PatientNotifications.jsx'
import PatientDocuments from './pages/patient/PatientDocuments.jsx'
import PatientCalendar from './pages/patient/PatientCalendar.jsx'

/* 
import PatientProfile from './pages/patient/PatientProfile.jsx'
*/

// Admin Components

import AdminLayout from './components/AdminLayout.jsx'
import AdminOverview from './pages/admin/AdminOverview.jsx'
/* import AdminPatients from './pages/admin/AdminPatients.jsx'
import AdminPatient from './pages/admin/AdminPatient.jsx'
import AdminAddPatient from './pages/admin/AdminAddPatient.jsx'
import AdminFinances from './pages/admin/AdminFinances.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminSettings from './pages/admin/AdminSettings.jsx'
import AdminNotifications from './pages/admin/AdminNotifications.jsx'
import AdminDocuments from './pages/admin/AdminDocuments.jsx' */

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
          <Route path="overview" element={<StaffOverview />} />  
{/*           <Route path="patients" element={<StaffPatients />} />
          <Route path="patients/:patientId" element={<StaffPatient />} />
          <Route path="patients/:patientId/edit" element={<StaffAddPatient />} />
          <Route path="addpatient" element={<StaffAddPatient />} />
          <Route path="notifications" element={<StaffNotifications />} />
          <Route path="calendar" element={<StaffCalendar />} />
          <Route path="documents" element={<StaffDocuments />} /> */}
          <Route path="messaging" element={<StaffMessaging />} />
{/*   
          <Route path="profile" element={<StaffProfile />} /> 
*/}
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
          <Route path="appointment" element={<PatientAppointment />} />
          <Route path="messaging" element={<PatientMessaging />} />
          <Route path="notifications" element={<PatientNotifications />} />
          <Route path="documents" element={<PatientDocuments />} />
          <Route path="calendar" element={<PatientCalendar />} />
{/*           
          <Route path="profile" element={<PatientProfile />} />
          <Route path="settings" element={<PatientSettings />} /> 
*/}
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
{/*           <Route path="patients" element={<AdminPatients />} />    
          <Route path="patients/:patientId" element={<AdminPatient />} />
          <Route path="patients/:patientId/edit" element={<AdminAddPatient />} />
          <Route path="addpatient" element={<AdminAddPatient />} />

          <Route path="finances" element={<AdminFinances />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} /> 
          
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="documents" element={<AdminDocuments />} /> */}
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App