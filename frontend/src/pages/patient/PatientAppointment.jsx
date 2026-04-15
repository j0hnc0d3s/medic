import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

import '../styles/Appointment.css'

import down from '../../assets/images/down.png';
import calendar from '../../assets/images/calendar.png';
import time from '../../assets/images/time.png';

const NAV_ITEMS = [
  {
    label: 'Diagnosis',
    id: 'diagnosis',
  },
  {
    label: 'Treatment Plan',
    id: 'treatment',
  },
]

export default function PatientOverview() {
  const { userProfile, loading } = useAuth()
  const firstName = userProfile?.firstName || 'Patient'
  const [activeTab, setActiveTab] = useState('diagnosis')

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <>
        <div className="appointments">
            <div className="appointments-container">
                <div className="appointments-header">
                    <h2 className="appointment-header-title">New Appointment</h2>
                </div>

                <div className="appointments-body">
                    <div className="appointment-body-left">
                        <div className="appointment-body-section">
                            <div className="appointment-body-section-header">
                                <div className="appointment-body-title">Patient Information</div>
                                <div className="appointment-body-subtitle">Enter the patient's details below</div>
                            </div>

                            <div className="appointment-body-area">
                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Patient Name</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: John Smith</h2>

                                        <img 
                                            src={down}
                                            alt="Down"
                                            className="appointments-down-img"
                                        />
                                    </div>
                                </div>

                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Assign Doctor</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: John Smith</h2>

                                        <img 
                                            src={down}
                                            alt="Down"
                                            className="appointments-down-img"
                                        />
                                    </div>
                                </div>

                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Phone Number</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: +1 (876) 123-4567</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="appointment-body-area">
                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Date</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: John Smith</h2>

                                        <img 
                                            src={calendar}
                                            alt="Calendar"
                                            className="appointments-down-img"
                                        />
                                    </div>
                                </div>

                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Time</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: John Smith</h2>

                                        <img 
                                            src={time}
                                            alt="Down"
                                            className="appointments-down-img"
                                        />
                                    </div>
                                </div>

                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Duration</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: 30 mins</h2>

                                        <img 
                                            src={time}
                                            alt="Down"
                                            className="appointments-down-img"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="appointment-body-right">                   
                        <div className="appointment-body-section">
                            <div className="appointment-body-section-header">
                                <div className="appointment-body-title">Appointment Information</div>
                                <div className="appointment-body-subtitle">Enter the patient's appointment details below</div>
                            </div>

                            <div className="appointment-body-area">
                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Reason</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: I had a Stroke</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="appointment-body-area">
                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Type</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: Other</h2>

                                        <img 
                                            src={down}
                                            alt="Calendar"
                                            className="appointments-down-img"
                                        />
                                    </div>
                                </div>

                                <div className="appointment-body-content">
                                    <div className="appointment-body-text">Priority</div>

                                    <div className="appointment-body-textfield">
                                        <h2 className="appointment-body-placeholder">e.g: Other</h2>

                                        <img 
                                            src={down}
                                            alt="Down"
                                            className="appointments-down-img"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="appointments-body">
                    <div className="appointment-body-section">
                        <div className="appointment-body-section-header">
                            <div className="appointment-body-title">Additional Information</div>
                            <div className="appointment-body-subtitle">Enter the additional details below</div>
                        </div>

                        <div className="appointment-body-area">
                            <div className="appointment-body-content">
                                <div className="appointment-body-text">Patient Notes</div>

                                <div className="appointment-body-textfield lrg">
                                    <h2 className="appointment-body-placeholder">e.g: I feel sick</h2>
                                </div>
                            </div>

                            <div className="appointment-body-content">
                                <div className="appointment-body-text">Specialist Notes</div>

                                <div className="appointment-body-textfield lrg">
                                    <h2 className="appointment-body-placeholder">e.g: John Smith</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="nav-menu">
            <button className="nav-area">
                <span className="nav-label">Cancel</span>
            </button>
            
            <button className="nav-area active" style={{background: '#4da952'}}>
                <span className="nav-label" style={{color: '#FFFFFF'}}>Save</span>
            </button>
        </div>
    </>
  )
}