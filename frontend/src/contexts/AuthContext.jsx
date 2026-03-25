import { createContext, useContext, useEffect, useState } from 'react'
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sign in
  const signIn = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    // Fetch user profile from Firestore
    const profileDoc = await getDoc(doc(db, 'users', result.user.uid))
    if (profileDoc.exists()) {
      setUserProfile(profileDoc.data())
    }
    return result
  }

  // Sign up
  const signUp = async (email, password, profileData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      ...profileData,
      createdAt: new Date().toISOString()
    })
    setUserProfile(profileData)
    return result
  }

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth)
    setUserProfile(null)
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // Fetch user profile
        const profileDoc = await getDoc(doc(db, 'users', user.uid))
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data())
        }
      } else {
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    signIn,
    signUp,
    signOut,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
