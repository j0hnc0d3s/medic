import { useState, useEffect } from 'react'
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useParams, useNavigate } from 'react-router-dom'
import './StaffAddPatient.css'

export default function PatientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
    notes: ''
  })

  useEffect(() => {
    if (isEditMode) {
      loadPatient()
    }
  }, [id])

  const loadPatient = async () => {
    try {
      const docRef = doc(db, 'patients', id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          dateOfBirth: data.dateOfBirth?.toDate().toISOString().split('T')[0] || '',
          gender: data.gender || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          medicalHistory: data.medicalHistory || '',
          notes: data.notes || ''
        })
      } else {
        alert('Patient not found')
        navigate('/admin/patients')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading patient:', error)
      alert('Failed to load patient')
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      alert('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      alert('Last name is required')
      return false
    }
    if (!formData.dateOfBirth) {
      alert('Date of birth is required')
      return false
    }
    if (!formData.phone.trim()) {
      alert('Phone number is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)

    try {
      const patientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: Timestamp.fromDate(new Date(formData.dateOfBirth)),
        gender: formData.gender,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        medicalHistory: formData.medicalHistory.trim(),
        notes: formData.notes.trim(),
        updatedAt: Timestamp.now()
      }

      // Add birthdayMD for birthday queries (format: "3-15")
      const dobDate = new Date(formData.dateOfBirth)
      patientData.birthdayMD = `${dobDate.getMonth() + 1}-${dobDate.getDate()}`

      if (isEditMode) {
        // Update existing patient
        const docRef = doc(db, 'patients', id)
        await updateDoc(docRef, patientData)
        alert('Patient updated successfully')
        navigate(`/admin/patients/${id}`)
      } else {
        // Create new patient
        patientData.createdAt = Timestamp.now()
        patientData.visits = [] // Initialize empty visits array
        
        const docRef = await addDoc(collection(db, 'patients'), patientData)
        alert('Patient added successfully')
        navigate(`/admin/patients/${docRef.id}`)
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      alert(`Failed to ${isEditMode ? 'update' : 'add'} patient`)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="patient-form loading">
        <div className="loading-spinner">Loading patient...</div>
      </div>
    )
  }

  return (
    <div className="patients">
      <div className="patient-form">
        <header className="form-header">
          <h1 className="form-title">{isEditMode ? 'Edit Patient' : 'Add New Patient'}</h1>
        </header>

        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-card">
            <h3>Personal Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                
                <select
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h3>Contact Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 876-555-0123"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.smith@example.com"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, Kingston, Jamaica"
                />
              </div>
            </div>
          </div>

          <div className="form-card">
            <h3>Medical Information</h3>
            
            <div className="form-group">
              <label className="form-label">Medical History</label>
              <textarea
                name="medicalHistory"
                className="form-textarea"
                value={formData.medicalHistory}
                onChange={handleChange}
                placeholder="Any relevant medical history, conditions, allergies, medications, etc."
                rows="5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                className="form-textarea"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes (e.g., preferred appointment times, special requirements, family history)"
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(isEditMode ? `/admin/patients/${id}` : '/admin/patients')}
              disabled={saving}
            >
              Cancel
            </button>

            <button 
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Patient' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}