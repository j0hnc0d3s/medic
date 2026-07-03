import {
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

/**
 * Authentication Service
 * Handles all authentication-related operations
 */

class AuthService {
  // NOTE: register() and login() were removed — Login.jsx calls
  // /api/auth/register and /api/auth/login directly instead. That's
  // intentional, not an oversight: this class's old register() took
  // `role` as a raw client-supplied param with no server-side check,
  // so a client could self-assign role: 'admin'. The backend route
  // validates/ignores that instead of trusting it. Don't re-add a
  // client-side register()/login() without the same protection.

  /**
   * Logout current user
   * @returns {Promise<Object>}
   */
  async logout() {
    try {
      await signOut(auth)
      return {
        success: true
      }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // NOTE: resetPassword() (Firebase's built-in email-link reset) was
  // removed — ForgotPasswordForm.jsx implements a custom 6-digit OTP
  // flow via /api/auth/forgot-password instead. These are two
  // different UX flows, not a duplicate — don't reintroduce this as
  // "the" reset method without checking which one the UI actually uses.

  /**
   * Update user profile
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updates) {
    try {
      const userRef = doc(db, 'users', userId)
      
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })

      // Update auth profile if name changed
      if (updates.firstName || updates.lastName) {
        const currentUser = auth.currentUser
        if (currentUser) {
          await updateProfile(currentUser, {
            displayName: `${updates.firstName || ''} ${updates.lastName || ''}`.trim()
          })
        }
      }

      return {
        success: true,
        message: 'Profile updated successfully'
      }
    } catch (error) {
      console.error('Profile update error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update user email
   * @param {string} newEmail 
   * @param {string} currentPassword - For reauthentication
   * @returns {Promise<Object>}
   */
  async updateEmail(newEmail, currentPassword) {
    try {
      const user = auth.currentUser
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update email in auth
      await updateEmail(user, newEmail)

      // Update email in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        updatedAt: Timestamp.now()
      })

      return {
        success: true,
        message: 'Email updated successfully'
      }
    } catch (error) {
      console.error('Email update error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update user password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<Object>}
   */
  async updatePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)

      return {
        success: true,
        message: 'Password updated successfully'
      }
    } catch (error) {
      console.error('Password update error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get current user data from Firestore
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    try {
      const user = auth.currentUser
      
      if (!user) {
        return {
          success: false,
          error: 'No user logged in'
        }
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'User data not found'
        }
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...userDoc.data()
        }
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get user by ID
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      return {
        success: true,
        user: {
          uid: userId,
          ...userDoc.data()
        }
      }
    } catch (error) {
      console.error('Get user error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get all users with a given role (e.g. 'doctor', 'nurse', 'patient')
   * @param {string} role 
   * @returns {Promise<Object>}
   */
  async getUsersByRole(role) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', role))
      const querySnapshot = await getDocs(q)

      const users = []
      querySnapshot.forEach((docSnap) => {
        users.push({
          uid: docSnap.id,
          ...docSnap.data()
        })
      })

      return {
        success: true,
        users,
        count: users.length
      }
    } catch (error) {
      console.error('Get users by role error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get a user by email — case-insensitive, matches the lowercased
   * email auth.py stores on registration.
   *
   * ⚠️ KNOWN TO FAIL for staff calling this about someone else's
   * account — Firestore rules correctly block cross-account email
   * lookups from the client. Confirmed via console error:
   * "Missing or insufficient permissions." Use
   * api.js's linkPatientToAccount() (backend, Admin SDK) instead for
   * the patient-linking flow. This may still work for a user looking
   * up their own record, if rules permit that — untested.
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async getUserByEmail(email) {
    try {
      if (!email) return { success: false, error: 'Email is required' }

      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return { success: true, user: null }
      }

      const docSnap = querySnapshot.docs[0]
      return {
        success: true,
        user: { uid: docSnap.id, ...docSnap.data() }
      }
    } catch (error) {
      console.error('Get user by email error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new AuthService()