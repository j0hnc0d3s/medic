import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { patientService, activityService } from '../../services'
import jsPDF from 'jspdf'

import '../styles/Patient.css'

export default function PatientDetail() {
  const { patientId } = useParams()  // ← Fixed: matches route param name
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [visitNotes, setVisitNotes] = useState('')

  useEffect(() => {
    loadPatient()
  }, [patientId])

  useEffect(() => {
    // Close modal on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showAddVisit) {
        setShowAddVisit(false)
        setVisitNotes('')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showAddVisit])  // ← Fixed dependency

  const loadPatient = async () => {
    try {
      const result = await patientService.getPatient(patientId)
      
      if (result.success) {
        setPatient(result.patient)
      } else {
        alert('Patient not found')
        navigate('/admin/patients')
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading patient:', error)
      setLoading(false)
    }
  }

  const addVisit = async () => {
    if (!visitNotes.trim()) {
      alert('Please enter visit notes')
      return
    }

    try {
      // Direct Firestore update for visits (not in service yet)
      const docRef = doc(db, 'patients', patientId)
      await updateDoc(docRef, {
        visits: arrayUnion({
          date: Timestamp.now(),
          notes: visitNotes
        }),
        updatedAt: Timestamp.now()
      })

      // Log activity
      await activityService.logActivity({
        action: 'Visit Added',
        description: `New visit recorded for ${patient.firstName} ${patient.lastName}`,
        type: 'patient-updated',
        user: 'Admin',
        entity: patientId
      })

      // Close modal and clear form
      setVisitNotes('')
      setShowAddVisit(false)
      loadPatient()
      alert('Visit added successfully')
    } catch (error) {
      console.error('Error adding visit:', error)
      alert('Failed to add visit')
    }
  }

  const generateSummaryPDF = () => {
    const doc = new jsPDF()
    
    // Clinic header
    doc.setFontSize(20)
    doc.setTextColor(31, 71, 136)
    doc.text('Medic Clinic', 20, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text('Patient Summary Report', 20, 28)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 34)
    
    // Patient info
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39)
    doc.text('Patient Information', 20, 50)
    
    doc.setFontSize(11)
    doc.setTextColor(55, 65, 81)
    doc.text(`Name: ${patient.firstName} ${patient.lastName}`, 20, 60)
    doc.text(`Date of Birth: ${formatDate(patient.dateOfBirth)}`, 20, 68)
    doc.text(`Phone: ${patient.phone || 'N/A'}`, 20, 76)
    doc.text(`Email: ${patient.email || 'N/A'}`, 20, 84)
    doc.text(`Address: ${patient.address || 'N/A'}`, 20, 92)
    
    // Medical history
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39)
    doc.text('Medical History', 20, 110)
    
    doc.setFontSize(11)
    doc.setTextColor(55, 65, 81)
    const historyLines = doc.splitTextToSize(patient.medicalHistory || 'No medical history recorded', 170)
    doc.text(historyLines, 20, 120)
    
    // Visit history
    let yPos = 120 + (historyLines.length * 6) + 10
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39)
    doc.text('Visit History', 20, yPos)
    yPos += 10
    
    if (patient.visits && patient.visits.length > 0) {
      doc.setFontSize(11)
      patient.visits.slice().reverse().forEach((visit, index) => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        
        doc.setTextColor(31, 71, 136)
        doc.text(`Visit ${patient.visits.length - index}`, 20, yPos)
        doc.setTextColor(107, 114, 128)
        doc.text(formatDate(visit.date), 50, yPos)
        yPos += 6
        
        doc.setTextColor(55, 65, 81)
        const noteLines = doc.splitTextToSize(visit.notes, 170)
        doc.text(noteLines, 20, yPos)
        yPos += (noteLines.length * 6) + 8
      })
    } else {
      doc.setFontSize(11)
      doc.setTextColor(107, 114, 128)
      doc.text('No visits recorded', 20, yPos)
    }
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text('This is a confidential medical document', 20, 285)
    
    doc.save(`${patient.lastName}_${patient.firstName}_Summary.pdf`)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getAge = (dob) => {
    if (!dob) return 'N/A'
    const birthDate = dob.toDate ? dob.toDate() : new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getInitials = () => {
    return `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="patient loading">
        <div className="loading-spinner">Loading patient...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="patient">
        <div className="error-message">Patient not found</div>
      </div>
    )
  }

  return (
    <div className="patients">
      <div className="patient">
        <header className="detail-header-bar">
          <button 
            className="back-btn"
            onClick={() => navigate('/admin/patients')}
          >
            ← Back to Patients
          </button>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={generateSummaryPDF}
            >
              📄 Generate Summary PDF
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/admin/patients/${patientId}/edit`)}
            >
              Edit Patient
            </button>
          </div>
        </header>

        {/* Patient Header */}
        <div className="detail-card">
          <div className="patient-header">
            <div className="patient-avatar-large">
              {getInitials()}
            </div>
            <div className="patient-info">
              <h1>{patient.firstName} {patient.lastName}</h1>
              <p className="patient-meta">
                {getAge(patient.dateOfBirth)} years old • Born {formatDate(patient.dateOfBirth)}
              </p>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">{patient.phone || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{patient.email || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Address</span>
              <span className="info-value">{patient.address || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Visit</span>
              <span className="info-value">
                {patient.visits && patient.visits.length > 0
                  ? formatDate(patient.visits[patient.visits.length - 1].date)
                  : 'No visits yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="detail-card">
          <h3>Medical History</h3>
          <p className="medical-history">
            {patient.medicalHistory || 'No medical history recorded'}
          </p>
        </div>

        {/* Notes */}
        {patient.notes && (
          <div className="detail-card">
            <h3>Notes</h3>
            <p className="medical-history">{patient.notes}</p>
          </div>
        )}

        {/* Visit History */}
        <div className="detail-card">
          <div className="card-header-row">
            <h3>Visit History</h3>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddVisit(true)}
            >
              + Add Visit
            </button>
          </div>

          {patient.visits && patient.visits.length > 0 ? (
            <div className="visit-list">
              {[...patient.visits].reverse().map((visit, index) => (
                <div key={index} className="visit-item">
                  <div className="visit-header">
                    <span className="visit-title">
                      Visit {patient.visits.length - index}
                    </span>
                    <span className="visit-date">
                      {formatDate(visit.date)}
                    </span>
                  </div>
                  <p className="visit-notes">{visit.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No visits recorded yet</p>
            </div>
          )}
        </div>

        {/* Add Visit Modal */}
        {showAddVisit && (
          <div className="modal-overlay" onClick={() => setShowAddVisit(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Visit</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowAddVisit(false)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Visit Notes</label>
                  <textarea
                    className="visit-textarea"
                    placeholder="Enter visit notes, diagnosis, treatment plan, etc..."
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    rows={8}
                    autoFocus
                  />
                </div>

                <div className="visit-meta">
                  <span className="visit-date-label">
                    📅 Visit Date: {new Date().toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setVisitNotes('')
                    setShowAddVisit(false)
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={addVisit}
                  disabled={!visitNotes.trim()}
                >
                  Save Visit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}