import { useState, useEffect, useNavigate } from 'react'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'

import '../styles/Appointment.css'

import search from '../../assets/images/search.png';
import calendar from '../../assets/images/calendar.png';
import add from '../../assets/images/plus.png';
import down from '../../assets/images/down.png';

export default function Appointments() {
  const [appointments, setAppointments] = useState([])

  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState(null)

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    type: '',
    doctor: '',
    status: 'scheduled',
    notes: ''
  })

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const apptsQuery = query(
        collection(db, 'appointments'),
        orderBy('appointmentDate', 'desc')
      )
      const snapshot = await getDocs(apptsQuery)
      const appts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAppointments(appts)
      setLoading(false)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      patientName: '',
      patientPhone: '',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '',
      type: '',
      doctor: '',
      status: 'scheduled',
      notes: ''
    })
    setEditingAppt(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.patientName.trim()) {
      alert('Patient name is required')
      return
    }

    try {
      const data = {
        ...formData,
        patientName: formData.patientName.trim(),
        appointmentDate: Timestamp.fromDate(new Date(formData.appointmentDate)),
        updatedAt: Timestamp.now()
      }

      if (editingAppt) {
        await updateDoc(doc(db, 'appointments', editingAppt.id), data)
        alert('Appointment updated successfully')
      } else {
        data.createdAt = Timestamp.now()
        await addDoc(collection(db, 'appointments'), data)
        alert('Appointment created successfully')
      }

      setShowModal(false)
      resetForm()
      loadAppointments()
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('Failed to save appointment')
    }
  }

  const handleEdit = (appt) => {
    setEditingAppt(appt)
    setFormData({
      patientName: appt.patientName || '',
      patientPhone: appt.patientPhone || '',
      appointmentDate: appt.appointmentDate?.toDate().toISOString().split('T')[0] || '',
      appointmentTime: appt.appointmentTime || '',
      type: appt.type || '',
      doctor: appt.doctor || '',
      status: appt.status || 'scheduled',
      notes: appt.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return

    try {
      await deleteDoc(doc(db, 'appointments', id))
      alert('Appointment deleted')
      loadAppointments()
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: newStatus,
        updatedAt: Timestamp.now()
      })
      loadAppointments()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#F59E0B',
      confirmed: '#3B82F6',
      'in-progress': '#2D9C9C',
      completed: '#22C55E',
      cancelled: '#EF4444',
      'no-show': '#6B7280'
    }
    return colors[status] || '#6B7280'
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const types = ['General Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Procedure']
  const doctors = ['Dr. Sarah Mitchell', 'Dr. James Wilson', 'Dr. Paula Chen']
  const statuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']

  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    
    let matchesDate = true
    if (filterDate === 'today') {
      const today = new Date().toDateString()
      matchesDate = a.appointmentDate?.toDate().toDateString() === today
    } else if (filterDate === 'upcoming') {
      matchesDate = a.appointmentDate?.toDate() >= new Date()
    } else if (filterDate === 'past') {
      matchesDate = a.appointmentDate?.toDate() < new Date()
    }

    return matchesStatus && matchesDate
  })

  const todayCount = appointments.filter(a => 
    a.appointmentDate?.toDate().toDateString() === new Date().toDateString()
  ).length

  const upcomingCount = appointments.filter(a => 
    a.appointmentDate?.toDate() >= new Date() && a.status !== 'cancelled'
  ).length

  if (loading) {
    return (
      <div className="appointments loading">
        <div className="loading-spinner">Loading appointments...</div>
      </div>
    )
  }

return (
    <div className="appointments">
        <div className="appointments-container">
            <header className="appointments-header">
                    <div className="appointments-search">
                            <div className="appointments-search-header">
                                    <img 
                                        src={search}
                                        className="appointments-search-img"
                                        alt="Search"
                                    />

                                    <p className="notifications-search-text">Search</p>
                            </div>

                            <div className="appointments-search-filters">
                                    <div className="appointments-filter">
                                            <p className="appointments-filter-title">All Types</p>
                                            
                                            <img 
                                                src={down}
                                                className="appointments-down-img"
                                                alt="Filter"
                                            />
                                    </div>

                                    <div className="appointments-filter">
                                            <p className="appointments-filter-title">All</p>
                                            
                                            <img 
                                                src={down}
                                                className="appointments-down-img"
                                                alt="Filter"
                                            />
                                    </div>

                                    <button className="appointments-filter" style={{background: '#3fa04a'}} onClick={() => window.location.href = '/patient/appointment'}>
                                            <img 
                                                src={add}
                                                className="appointments-down-img"
                                                alt="Add"
                                            />

                                            <p className="appointments-filter-title">Book Appointment</p>
                                    </button>
                            </div>
                    </div>
            </header>

            {filteredAppointments.length > 0 ? (
                <div className="appointments-list">
                    {filteredAppointments.map(appt => (
                        <div key={appt.id} className="appointment-card">
                            <div className="appointment-header">
                                <div className="appointment-time-block">
                                    <div className="appointment-date">{formatDate(appt.appointmentDate)}</div>
                                    <div className="appointment-time">{appt.appointmentTime}</div>
                                </div>

                                <div 
                                    className="status-badge"
                                    style={{
                                        background: `${getStatusColor(appt.status)}15`,
                                        color: getStatusColor(appt.status)
                                    }}
                                >
                                    {appt.status?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </div>
                            </div>

                            <div className="appointment-body">
                                <h3 className="patient-name">{appt.patientName}</h3>
                                {appt.patientPhone && (
                                    <p className="patient-phone">{appt.patientPhone}</p>
                                )}
                                <div className="appointment-details">
                                    {appt.type && <span className="detail-badge">{appt.type}</span>}
                                    {appt.doctor && <span className="detail-badge">{appt.doctor}</span>}
                                </div>
                                {appt.notes && (
                                    <p className="appointment-notes">{appt.notes}</p>
                                )}
                            </div>

                            <div className="appointment-footer">
                                <div className="status-actions">
                                    {appt.status === 'scheduled' && (
                                        <button 
                                            className="btn-sm btn-confirm"
                                            onClick={() => updateStatus(appt.id, 'confirmed')}
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {appt.status === 'confirmed' && (
                                        <button 
                                            className="btn-sm btn-start"
                                            onClick={() => updateStatus(appt.id, 'in-progress')}
                                        >
                                            Start
                                        </button>
                                    )}
                                    {appt.status === 'in-progress' && (
                                        <button 
                                            className="btn-sm btn-complete"
                                            onClick={() => updateStatus(appt.id, 'completed')}
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>

                                <div className="action-buttons">
                                    <button className="btn-text" onClick={() => handleEdit(appt)}>
                                        Edit
                                    </button>
                                    <button className="btn-text delete" onClick={() => handleDelete(appt.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="appointments-empty-state">
                    <img 
                        src={calendar} 
                        alt="Calendar" 
                        className="appointments-list-img xlrg"
                    />

                    <div className="appointments-empty-text">Cleared.</div>
                    <div className="appointments-empty-subtext">Nothing to see here.</div>
                </div>
            )}
        </div>

        {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">
                            {editingAppt ? 'Edit Appointment' : 'New Appointment'}
                        </h2>
                        <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Patient Name *</label>
                                    <input
                                        type="text"
                                        name="patientName"
                                        className="form-input"
                                        value={formData.patientName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        name="patientPhone"
                                        className="form-input"
                                        value={formData.patientPhone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input
                                        type="date"
                                        name="appointmentDate"
                                        className="form-input"
                                        value={formData.appointmentDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Time *</label>
                                    <input
                                        type="time"
                                        name="appointmentTime"
                                        className="form-input"
                                        value={formData.appointmentTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        name="type"
                                        className="form-select"
                                        value={formData.type}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select type</option>
                                        {types.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Doctor</label>
                                    <select
                                        name="doctor"
                                        className="form-select"
                                        value={formData.doctor}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select doctor</option>
                                        {doctors.map(doc => (
                                            <option key={doc} value={doc}>{doc}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        className="form-select"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        {statuses.map(status => (
                                            <option key={status} value={status}>
                                                {status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        name="notes"
                                        className="form-textarea"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Additional notes or instructions..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingAppt ? 'Update' : 'Create'} Appointment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
)
}