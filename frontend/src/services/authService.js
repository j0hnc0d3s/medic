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
}

export default new AuthService()