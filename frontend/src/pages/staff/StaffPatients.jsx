import { useState, useEffect } from 'react'
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useNavigate } from 'react-router-dom'
import './StaffPatients.css'

export default function PatientsDatabase() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOption, setFilterOption] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    filterPatients()
  }, [searchTerm, filterOption, patients])

  const loadPatients = async () => {
    try {
      const patientsQuery = query(
        collection(db, 'patients'),
        orderBy('lastName', 'asc')
      )
      const snapshot = await getDocs(patientsQuery)
      const patientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPatients(patientsData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading patients:', error)
      setLoading(false)
    }
  }

  const filterPatients = () => {
    let filtered = [...patients]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase()
        const phone = patient.phone?.toLowerCase() || ''
        const email = patient.email?.toLowerCase() || ''
        return fullName.includes(term) || phone.includes(term) || email.includes(term)
      })
    }

    // Apply date filter
    if (filterOption !== 'all') {
      const now = new Date()
      filtered = filtered.filter(patient => {
        if (!patient.visits || patient.visits.length === 0) return false
        
        const lastVisit = patient.visits[patient.visits.length - 1].date.toDate()
        
        switch (filterOption) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return lastVisit >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return lastVisit >= monthAgo
          case 'inactive':
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            return lastVisit < threeMonthsAgo
          default:
            return true
        }
      })
    }

    setFilteredPatients(filtered)
  }

  const handleDelete = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'patients', patientId))
      setPatients(patients.filter(p => p.id !== patientId))
      alert('Patient deleted successfully')
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Failed to delete patient')
    }
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const getAvatarColor = (index) => {
    const colors = ['#2D9C9C', '#FF6B6B', '#1F4788', '#F59E0B', '#8B5CF6']
    return colors[index % colors.length]
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getLastVisit = (patient) => {
    if (!patient.visits || patient.visits.length === 0) return null
    return patient.visits[patient.visits.length - 1].date
  }

  if (loading) {
    return (
      <div className="patients-database loading">
        <div className="loading-spinner">Loading patients...</div>
      </div>
    )
  }

  return (
    <div className="patients">
      <div className="patients-database">
        <header className="database-header">
          <div>
            <h1>Patient Records</h1>
            <p>{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {/* Export CSV logic */}}
            >
              Export CSV
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin/addpatient')}
            >
              + Add Patient
            </button>
          </div>
        </header>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search patients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="filter-select"
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
          >
            <option value="all">All Patients</option>
            <option value="week">Visited This Week</option>
            <option value="month">Visited This Month</option>
            <option value="inactive">Not Visited (3+ months)</option>
          </select>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date of Birth</th>
                  <th>Phone</th>
                  <th>Last Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patient-cell">
                        <div 
                          className="patient-avatar"
                          style={{ background: getAvatarColor(index) }}
                        >
                          {getInitials(patient.firstName, patient.lastName)}
                        </div>
                        <span className="patient-name">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(patient.dateOfBirth)}</td>
                    <td>{patient.phone || 'N/A'}</td>
                    <td>{formatDate(getLastVisit(patient))}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-icon"
                          onClick={() => navigate(`/admin/patients/${patient.id}`)}
                          title="View Details"
                        >
                          View
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => navigate(`/admin/patients/${patient.id}/edit`)}
                          title="Edit Patient"
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => {/* Generate summary PDF */}}
                          title="Generate Summary"
                        >
                          Summary
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(patient.id)}
                          title="Delete Patient"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">No patients found</div>

            <div className="empty-subtext">
              {searchTerm || filterOption !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Add your first patient to get started'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}