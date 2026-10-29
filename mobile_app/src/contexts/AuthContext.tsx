import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { post } from '../services/api'

export type UserProfile = {
  uid: string
  email?: string
  firstName?: string
  lastName?: string
  role?: string
  phone?: string
  patientRecordId?: string
  notificationPreferences?: Record<string, boolean>
  [key: string]: unknown
}

type AuthContextValue = {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (user: User) => {
    const profileDoc = await getDoc(doc(db, 'users', user.uid))
    if (profileDoc.exists()) {
      setUserProfile({ uid: user.uid, ...(profileDoc.data() as object) } as UserProfile)
    } else {
      setUserProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const idToken = await result.user.getIdToken()

    // Same /api/auth/login round-trip the web app makes on sign-in —
    // verifies the token server-side and returns the account's role.
    // This app is patient-only, so a non-patient account (staff/admin
    // test credentials, say) is rejected here rather than silently
    // showing an empty patient dashboard.
    try {
      const data = await post('/api/auth/login', { token: idToken })
      if (data?.user?.role && data.user.role !== 'patient') {
        await firebaseSignOut(auth)
        throw new Error('This app is for patients only. Please use the staff portal instead.')
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('patients only')) throw err
      // Backend verification is a belt-and-suspenders check — if the
      // backend call itself fails (network blip), don't lock the
      // patient out of their own account over it.
      console.warn('auth/login verification call failed, continuing:', err)
    }

    await loadProfile(result.user)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUserProfile(null)
  }

  const refreshProfile = async () => {
    if (auth.currentUser) await loadProfile(auth.currentUser)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true)
      setCurrentUser(user)
      if (user) {
        await loadProfile(user)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
