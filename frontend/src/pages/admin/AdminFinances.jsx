import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useSearchParams } from 'react-router-dom'
import './AdminFinances.css'

export default function Finances() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'income'

  const [incomeData, setIncomeData] = useState([])
  const [expenditureData, setExpenditureData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)  // ✅ Changed from showAddForm
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: ''
  })

  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = async () => {
    try {
      // Load income
      const incomeQuery = query(
        collection(db, 'income'),
        orderBy('date', 'desc')
      )
      const incomeSnapshot = await getDocs(incomeQuery)
      const income = incomeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setIncomeData(income)

      // Load expenditure
      const expenseQuery = query(
        collection(db, 'expenditure'),
        orderBy('date', 'desc')
      )
      const expenseSnapshot = await getDocs(expenseQuery)
      const expenses = expenseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setExpenditureData(expenses)

      setLoading(false)
    } catch (error) {
      console.error('Error loading financial data:', error)
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
    setShowModal(false)
    resetForm()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.description.trim()) {
      alert('Description is required')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    if (!formData.category) {
      alert('Category is required')
      return
    }

    try {
      const collectionName = activeTab === 'income' ? 'income' : 'expenditure'
      const data = {
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        createdAt: Timestamp.now()
      }

      await addDoc(collection(db, collectionName), data)
      alert(`${activeTab === 'income' ? 'Income' : 'Expense'} added successfully`)
      
      setShowModal(false)
      resetForm()
      loadFinancialData()
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Failed to add transaction')
    }
  }

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const collectionName = type === 'income' ? 'income' : 'expenditure'
      await deleteDoc(doc(db, collectionName, id))
      alert('Transaction deleted successfully')
      loadFinancialData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Failed to delete transaction')
    }
  }

  const exportToCSV = () => {
    const data = activeTab === 'income' ? incomeData : expenditureData
    const headers = ['Date', 'Description', 'Category', 'Amount']
    const rows = data.map(item => [
      formatDate(item.date),
      item.description,
      item.category,
      item.amount.toFixed(2)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateTotal = (data) => {
    return data.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const getCategoryColor = (category, type) => {
    const incomeColors = {
      'Consultation': '#1F4788',
      'Procedure': '#2D9C9C',
      'Medication': '#6B7280',
      'Other': '#9CA3AF'
    }
    const expenseColors = {
      'Supplies': '#1F4788',
      'Equipment': '#2D9C9C',
      'Utilities': '#F59E0B',
      'Salaries': '#8B5CF6',
      'Rent': '#6B7280',
      'Other': '#9CA3AF'
    }
    const colors = type === 'income' ? incomeColors : expenseColors
    return colors[category] || '#9CA3AF'
  }

  const incomeCategories = ['Consultation', 'Procedure', 'Medication', 'Other']
  const expenseCategories = ['Supplies', 'Equipment', 'Utilities', 'Salaries', 'Rent', 'Other']

  const currentData = activeTab === 'income' ? incomeData : expenditureData
  const currentTotal = calculateTotal(currentData)

  if (loading) {
    return (
      <div className="finances loading">
        <div className="loading-spinner">Loading financial data...</div>
      </div>
    )
  }

  return (
    <div className="finances">
      <div className="finance">
        <header className="finances-header">
          <h1 className="finance-title">Finances</h1>

          <div className="header-actions">
            <button className="btn btn-secondary" onClick={exportToCSV}>
              Export CSV
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              + Add {activeTab === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => handleTabChange('income')}
          >
            Income
          </button>
          <button 
            className={`tab ${activeTab === 'expenditure' ? 'active' : ''}`}
            onClick={() => handleTabChange('expenditure')}
          >
            Expenditure
          </button>
        </div>

        {/* Summary Card */}
        <div className={`summary-card ${activeTab}`}>
          <div className="summary-label">
            Total {activeTab === 'income' ? 'Income' : 'Expenses'} (All Time)
          </div>
          <div className="summary-amount">
            ${currentTotal.toFixed(2)}
          </div>
        </div>

        {/* Transactions Table */}
        {currentData.length > 0 ? (
          <div className="table-container">
            <table className="finances-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(item => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.description}</td>
                    <td>
                      <span 
                        className="category-badge"
                        style={{ 
                          backgroundColor: `${getCategoryColor(item.category, activeTab)}15`,
                          color: getCategoryColor(item.category, activeTab)
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className={`amount ${activeTab}`}>
                      ${item.amount.toFixed(2)}
                    </td>
                    <td>
                      <button 
                        className="btn-icon delete"
                        onClick={() => handleDelete(item.id, activeTab)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === 'income' ? '💰' : '💸'}
            </div>
            <div className="empty-text">
              No {activeTab === 'income' ? 'income' : 'expenses'} recorded yet
            </div>
            <div className="empty-subtext">
              Add your first {activeTab === 'income' ? 'income' : 'expense'} to start tracking
            </div>
          </div>
        )}
      </div>

      {/* ✅ NEW: Modal Popup */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Add {activeTab === 'income' ? 'Income' : 'Expense'}
              </h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      name="date"
                      className="form-input"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select category</option>
                      {(activeTab === 'income' ? incomeCategories : expenseCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Description *</label>
                    <input
                      type="text"
                      name="description"
                      className="form-input"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="e.g., Consultation - John Smith"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (USD) *</label>
                    <input
                      type="number"
                      name="amount"
                      className="form-input"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save {activeTab === 'income' ? 'Income' : 'Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}