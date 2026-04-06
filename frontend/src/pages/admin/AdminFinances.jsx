import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { financeService, patientService } from '../../services'
import './AdminFinances.css'

export default function Finances() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'income'

  const [incomeData, setIncomeData] = useState([])
  const [expenditureData, setExpenditureData] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    patientId: '',
    patientName: '',
    paymentStatus: 'paid'
  })

  useEffect(() => {
    loadFinancialData()
    loadPatients()
  }, [])

  const loadFinancialData = async () => {
    try {
      const result = await financeService.getTransactions()
      
      if (result.success) {
        const income = result.transactions.filter(t => t.type === 'income')
        const expenses = result.transactions.filter(t => t.type === 'expense')
        
        setIncomeData(income)
        setExpenditureData(expenses)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading financial data:', error)
      setLoading(false)
    }
  }

  const loadPatients = async () => {
    try {
      const result = await patientService.getPatients()
      
      if (result.success) {
        setPatients(result.patients)
      }
    } catch (error) {
      console.error('Error loading patients:', error)
    }
  }

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
    setShowModal(false)
    resetForm()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // If patient selected, auto-fill patient name
    if (name === 'patientId' && value) {
      const selectedPatient = patients.find(p => p.id === value)
      if (selectedPatient) {
        setFormData(prev => ({
          ...prev,
          patientId: value,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`
        }))
        return
      }
    }
    
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
      category: '',
      patientId: '',
      patientName: '',
      paymentStatus: 'paid'
    })
  }

  const validateForm = () => {
    if (!formData.description.trim()) {
      alert('Description is required')
      return false
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return false
    }
    if (!formData.category) {
      alert('Category is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const transactionData = {
        type: activeTab === 'income' ? 'income' : 'expense',
        date: formData.date,
        description: formData.description.trim(),
        amount: formData.amount,
        category: formData.category,
        patientId: formData.patientId || null,
        patientName: formData.patientName || null,
        paymentStatus: formData.paymentStatus,
        createdBy: 'Admin'
      }

      const result = await financeService.addTransaction(transactionData)
      
      if (result.success) {
        alert(`${activeTab === 'income' ? 'Income' : 'Expense'} added successfully`)
        setShowModal(false)
        resetForm()
        loadFinancialData()
      } else {
        alert(`Failed to add transaction: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Failed to add transaction')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const result = await financeService.deleteTransaction(id)
      
      if (result.success) {
        alert('Transaction deleted successfully')
        loadFinancialData()
      } else {
        alert(`Failed to delete: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Failed to delete transaction')
    }
  }

  const exportToCSV = () => {
    const data = activeTab === 'income' ? incomeData : expenditureData
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Patient', 'Payment Status']
    const rows = data.map(item => [
      formatDate(item.date),
      item.description,
      item.category,
      item.amount.toFixed(2),
      item.patientName || 'N/A',
      item.paymentStatus || 'N/A'
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
      'Lab Work': '#8B5CF6',
      'Other': '#9CA3AF'
    }
    const expenseColors = {
      'Supplies': '#1F4788',
      'Equipment': '#2D9C9C',
      'Utilities': '#F59E0B',
      'Salaries': '#8B5CF6',
      'Lab Work': '#8B5CF6',
      'Rent': '#6B7280',
      'Other': '#9CA3AF'
    }
    const colors = type === 'income' ? incomeColors : expenseColors
    return colors[category] || '#9CA3AF'
  }

  const getPaymentStatusBadge = (status) => {
    const badges = {
      'paid': { text: 'Paid', class: 'completed' },
      'unpaid': { text: 'Unpaid', class: 'pending' },
      'pending': { text: 'Pending', class: 'in-progress' }
    }
    return badges[status] || badges['paid']
  }

  const incomeCategories = ['Consultation', 'Procedure', 'Medication', 'Lab Work', 'Other']
  const expenseCategories = ['Supplies', 'Equipment', 'Utilities', 'Salaries', 'Lab Work', 'Rent', 'Other']

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
                  <th>Patient</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(item => {
                  const paymentBadge = getPaymentStatusBadge(item.paymentStatus)
                  return (
                    <tr key={item.id}>
                      <td>{formatDate(item.date)}</td>
                      <td>{item.description}</td>
                      <td>
                        {item.patientId ? (
                          <span 
                            className="patient-link"
                            onClick={() => navigate(`/admin/patients/${item.patientId}`)}
                          >
                            {item.patientName}
                          </span>
                        ) : (
                          <span className="no-patient">—</span>
                        )}
                      </td>
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
                        <span className={`status-badge ${paymentBadge.class}`}>
                          {paymentBadge.text}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Add Transaction Modal */}
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

                  {/* Patient Selection */}
                  <div className="form-group full-width">
                    <label className="form-label">
                      Link to Patient <span className="optional-label">(optional)</span>
                    </label>
                    <select
                      name="patientId"
                      className="form-select"
                      value={formData.patientId}
                      onChange={handleChange}
                    >
                      <option value="">No patient</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </option>
                      ))}
                    </select>
                    <p className="form-hint">
                      This will appear in the patient's financial history
                    </p>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Description *</label>
                    <input
                      type="text"
                      name="description"
                      className="form-input"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="e.g., Lab work - Blood test"
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

                  <div className="form-group">
                    <label className="form-label">Payment Status *</label>
                    <select
                      name="paymentStatus"
                      className="form-select"
                      value={formData.paymentStatus}
                      onChange={handleChange}
                      required
                    >
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="pending">Pending</option>
                    </select>
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