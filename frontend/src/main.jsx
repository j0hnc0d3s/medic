import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'  // ← Import this!
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>  {/* ← Wrap with AuthProvider! */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)