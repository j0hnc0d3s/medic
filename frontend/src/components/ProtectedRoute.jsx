import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userProfile, loading } = useAuth()

  // 🔍 DEBUG - Add these logs
  console.log('🛡️ ProtectedRoute check:', {
    loading,
    currentUser: currentUser?.email,
    userProfile,
    allowedRoles
  })

  // Show loading while auth state is initializing
  if (loading) {
    console.log('⏳ Still loading auth state...')
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    console.log('❌ No currentUser - redirecting to login')
    return <Navigate to="/login" replace />
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && userProfile) {
    if (!allowedRoles.includes(userProfile.role)) {
      console.log('❌ Role mismatch - user has:', userProfile.role, 'needs:', allowedRoles)
      return <Navigate to="/unauthorized" replace />
    }
  }

  console.log('✅ ProtectedRoute passed - rendering children')
  return children
}