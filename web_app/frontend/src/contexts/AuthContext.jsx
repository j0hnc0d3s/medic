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

  const signIn = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const profileDoc = await getDoc(doc(db, 'users', result.user.uid))
    if (profileDoc.exists()) {
      setUserProfile({ uid: result.user.uid, ...profileDoc.data() })
    }
    return result
  }

  const signUp = async (email, password, profileData) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      ...profileData,
      createdAt: new Date().toISOString()
    })
    setUserProfile({ uid: result.user.uid, ...profileData })
    return result
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUserProfile(null)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // BUG FIX (Oct 2026): `loading` only ever starts true once, at
      // mount. On a SECOND onAuthStateChanged event -- i.e. signing in
      // as a different account without a full page reload, which is
      // exactly what happens when switching between the doctor/nurse/
      // receptionist/admin/patient test accounts -- setCurrentUser(user)
      // below updates synchronously to the new account, but userProfile
      // still holds the PREVIOUS account's data during this `await
      // getDoc(...)` gap, while loading stayed false the whole time.
      // ProtectedRoute renders in that gap with a mismatched
      // currentUser/userProfile pair (e.g. currentUser = doctor,
      // userProfile = patient), fails the role check, and incorrectly
      // bounces to /unauthorized -- confirmed live, reproducible on
      // every account switch. Resetting loading to true at the start
      // of every callback (not just the first) makes ProtectedRoute
      // show its loading state through the gap instead of rendering
      // (and redirecting) on stale data.
      setLoading(true)
      setCurrentUser(user)
      
      if (user) {
        const profileDoc = await getDoc(doc(db, 'users', user.uid))
        if (profileDoc.exists()) {
          setUserProfile({ uid: user.uid, ...profileDoc.data() })
        } else {
          setUserProfile(null)
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