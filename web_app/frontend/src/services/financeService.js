import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import activityService from './activityService'

/**
 * Finance Service
 * Handles financial transactions and billing
 */

class FinanceService {
  constructor() {
    this.collectionName = 'finances'
  }

  /**
   * Add a financial transaction
   * @param {Object} transactionData 
   * @returns {Promise<Object>}
   */
  async addTransaction(transactionData) {
    try {
      const data = {
        type: transactionData.type, // 'income' or 'expense'
        category: transactionData.category,
        amount: parseFloat(transactionData.amount),
        description: transactionData.description || '',
        date: transactionData.date ? Timestamp.fromDate(new Date(transactionData.date)) : Timestamp.now(),
        paymentMethod: transactionData.paymentMethod || '',
        patientId: transactionData.patientId || null,
        patientName: transactionData.patientName || '',
        invoiceNumber: transactionData.invoiceNumber || null,
        status: transactionData.status || 'completed',
        createdAt: Timestamp.now(),
        createdBy: transactionData.createdBy || 'Admin'
      }

      const docRef = await addDoc(collection(db, this.collectionName), data)

      // Log activity
      await activityService.logActivity({
        action: `${data.type === 'income' ? 'Income' : 'Expense'} Recorded`,
        description: `${data.category}: $${data.amount}`,
        type: 'finance-recorded',
        user: transactionData.createdBy || 'Admin',
        entity: docRef.id
      })

      return {
        success: true,
        transactionId: docRef.id,
        message: 'Transaction added successfully'
      }
    } catch (error) {
      console.error('Add transaction error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get transactions with filters
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getTransactions(filters = {}) {
    try {
      const queryConstraints = []

      if (filters.type) {
        queryConstraints.push(where('type', '==', filters.type))
      }

      if (filters.category) {
        queryConstraints.push(where('category', '==', filters.category))
      }

      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status))
      }

      queryConstraints.push(orderBy('date', 'desc'))

      const q = query(collection(db, this.collectionName), ...queryConstraints)
      const querySnapshot = await getDocs(q)

      const transactions = []
      querySnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return {
        success: true,
        transactions,
        count: transactions.length
      }
    } catch (error) {
      console.error('Get transactions error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Update transaction
   * @param {string} transactionId 
   * @param {Object} updates 
   * @returns {Promise<Object>}
   */
  async updateTransaction(transactionId, updates) {
    try {
      const docRef = doc(db, this.collectionName, transactionId)
      
      const data = { ...updates }
      
      if (updates.amount) {
        data.amount = parseFloat(updates.amount)
      }

      if (updates.date && !(updates.date instanceof Timestamp)) {
        data.date = Timestamp.fromDate(new Date(updates.date))
      }

      await updateDoc(docRef, data)

      return {
        success: true,
        message: 'Transaction updated successfully'
      }
    } catch (error) {
      console.error('Update transaction error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Delete transaction
   * @param {string} transactionId 
   * @returns {Promise<Object>}
   */
  async deleteTransaction(transactionId) {
    try {
      await deleteDoc(doc(db, this.collectionName, transactionId))

      return {
        success: true,
        message: 'Transaction deleted successfully'
      }
    } catch (error) {
      console.error('Delete transaction error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get financial summary
   * @param {Object} filters 
   * @returns {Promise<Object>}
   */
  async getSummary(filters = {}) {
    try {
      const transactions = await this.getTransactions(filters)
      
      if (!transactions.success) {
        return transactions
      }

      let totalIncome = 0
      let totalExpenses = 0
      const incomeByCategory = {}
      const expensesByCategory = {}

      transactions.transactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0
        
        if (t.type === 'income') {
          totalIncome += amount
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + amount
        } else if (t.type === 'expense') {
          totalExpenses += amount
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amount
        }
      })

      return {
        success: true,
        summary: {
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          incomeByCategory,
          expensesByCategory,
          transactionCount: transactions.count
        }
      }
    } catch (error) {
      console.error('Get summary error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new FinanceService()
