import { useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import { signOut } from 'firebase/auth'
import './Unauthorized.css'

export default function Unauthorized() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        {/* Icon */}
        <div className="unauthorized-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#FF6B6B" strokeWidth="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Content */}
        <h1 className="unauthorized-title">Access Denied</h1>
        <p className="unauthorized-message">
          You don't have permission to access this area. Please contact your administrator 
          if you believe this is an error.
        </p>

        {/* Actions */}
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn btn-outline">
            Go Back
          </button>
          <button onClick={handleLogout} className="btn btn-primary">
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
