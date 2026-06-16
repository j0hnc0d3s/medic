import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Unauthorized from './components/Unauthorized.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'

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
        

        {/* ========== PATIENT ROUTES ========== */}


        {/* ========== ADMIN ROUTES ========== */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App