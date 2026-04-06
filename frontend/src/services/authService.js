import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

/**
 * Authentication Service
 * Handles all authentication-related operations
 */

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User object
   */
  async register({ email, password, firstName, lastName, role = 'patient' }) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      })

      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        role,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true,
        phoneNumber: '',
        dateOfBirth: null,
        address: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        medicalHistory: [],
        allergies: [],
        medications: [],
        profilePicture: null
      }

      await setDoc(doc(db, 'users', user.uid), userData)

      return {
        success: true,
        user: userData
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Login user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Login result
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (!userDoc.exists()) {
        throw new Error('User data not found')
      }

      const userData = userDoc.data()

      // Check if user is active
      if (!userData.isActive) {
        await signOut(auth)
        throw new Error('Account is deactivated. Please contact support.')
      }

      // Update last login
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: Timestamp.now()
      })

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...userData
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

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

  /**
   * Send password reset email
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return {
        success: true,
        message: 'Password reset email sent'
      }
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

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
}

export default new AuthService()
