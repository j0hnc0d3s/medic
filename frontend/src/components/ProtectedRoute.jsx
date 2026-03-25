import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userProfile } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && userProfile) {
    if (!allowedRoles.includes(userProfile.role)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
