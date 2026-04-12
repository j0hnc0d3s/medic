import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './PatientOverview.css'

import test from '../../assets/images/test.png';
import top from '../../assets/images/top.png';
import document from '../../assets/images/document.png';
import upload from '../../assets/images/upload.png';
import dots from '../../assets/images/dots.png';
import next from '../../assets/images/next.png';
import close from '../../assets/images/close.png';


import scale from '../../assets/images/scale.png';
import user1 from '../../assets/images/user1.jpeg';
import user2 from '../../assets/images/user2.jpg';

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
  const [activeTab, setActiveTab] = useState('diagnosis') // ✅ Add state

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="patient-dashboard">
      <div className="patient-sidebar-left">
        <div className="card" style={{background: "#FFFFFF", border: "0"}}>
          <div className="card-header">
            <h2 className="card-title">Appointments</h2>

            <div className="card-img">
              <img 
                src={top} 
                alt="Top" 
                className="top-img"
              />
            </div>
          </div>
          
          <div className="overview-list">
            <div className="overview-list-item active">
              <div className="overview-list-avatar">
                <img 
                  src={user1}
                  className="avatar-img"
                />
              </div>

              <div className="overview-list-info">
                <p className="overview-list-time active">January 29th at 9:00 PM</p>
                <p className="overview-list-name active">Appointment with Dr. Coy</p>
              </div>

              <img 
                src={next}
                className="list-img lrg active"
              />
            </div>

            <div className="overview-list-item">
              <div className="overview-list-avatar">
                <img 
                  src={user1}
                  className="avatar-img"
                />
              </div>

              <div className="overview-list-info">
                <p className="overview-list-time">January 29th at 9:00 PM</p>
                <p className="overview-list-name">Appointment with Dr. Coy</p>
              </div>

              <img 
                src={next}
                className="list-img lrg"
              />
            </div>
          </div>

          <button className="link">See all</button>
        </div>

        <div className="card" style={{background: "#FFFFFF", border: "0"}}>
          <div className="card-header">
            <h2 className="card-title">Documents</h2>

            <div className="card-img">
              <img 
                src={top} 
                alt="Top" 
                className="list-img mid"
              />
            </div>
          </div>
          
          <div className="overview-list">
            <div className="overview-list-item">
              <div className="overview-list-header">
                <img 
                  src={document}
                  className="icon-img"
                />
                
                <p className="overview-list-name">Medical Documument.pdf</p>
              </div>

              <div className="list-imgs">
                <img 
                  src={upload}
                  className="list-img sml"
                />

                <img 
                  src={dots}
                  className="list-img"
                />
              </div>
            </div>
          </div>

          <button className="link">See all</button>
        </div>

        <div className="card" style={{background: "#FFFFFF", border: "0"}}>
          <div className="card-header">
            <h2 className="card-title">Latest blood test</h2>

            <div className="card-img">
              <img 
                src={top} 
                alt="Top" 
                className="list-img mid"
              />
            </div>
          </div>
          
          <div className="overview-list wrap">
            <div className="test-item">
              <div className="test-header">
                <p className="test-name">CPR</p>

                <p className="test-number">1.8 mg/L</p>
              </div>

              <p className="test-info">Highly concentrated</p>
            </div>

            <div className="test-item">
              <div className="test-header">
                <p className="test-name">CPR</p>

                <p className="test-number">1.8 mg/L</p>
              </div>

              <p className="test-info">Highly concentrated</p>
            </div>

            <div className="test-item">
              <div className="test-header">
                <p className="test-name">CPR</p>

                <p className="test-number">1.8 mg/L</p>
              </div>

              <p className="test-info">Highly concentrated</p>
            </div>

            <div className="test-item">
              <div className="test-header">
                <p className="test-name">CPR</p>

                <p className="test-number">1.8 mg/L</p>
              </div>

              <p className="test-info">Highly concentrated</p>
            </div>
          </div>

          <div className="doctor">
            <div className="doctor-item">
              <div className="doctor-profile">
                <div className="doctor-avatar">
                  <img 
                    src={user2}
                    className="doctor-avatar-img"
                  />
                </div>

                <p className="doctor-name">Dr. Evan Baxter</p>
              </div>

              <p className="doctor-time">February 28th 2026</p>
            </div>
          </div>
        </div>
      </div>

      <div className="patient-sidebar-center">
      </div>

      <div className="patient-sidebar-right">
        <div className="dashboard-menu">
          {NAV_ITEMS.map((item) => (
            <button  // ✅ Changed from NavLink to button
              key={item.id}  // ✅ Use id as key
              onClick={() => setActiveTab(item.id)}  // ✅ Click handler
              className={`menu-area ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ✅ Show content based on active tab */}
        {activeTab === 'diagnosis' && (
          <div className="card lrg" style={{background: "#FFFFFF", border: "0"}}>
            <div className="card-header">
              <h2 className="card-title">Left Shoulder</h2>

              <div className="card-img">
                <img 
                  src={close} 
                  alt="Close" 
                  className="list-img mid"
                />
              </div>
            </div>

            <div className="diagnosis">
              <div className="diagnosis-header">
                <p className="diagnosis-text">X-ray results</p>

                <div className="card-img">
                  <img 
                    src={dots} 
                    alt="Dots" 
                    className="list-img mid"
                  />
                </div>
              </div>

              <p className="diagnosis-subtext">Lorem ipsum dolor sit amet, eos verterem nominati in, 
                  electram postulant appellantur eam at, at nam 
                  quas putent iisque. </p>

              <div className="doctor">
                <div className="doctor-item">
                  <div className="doctor-profile">
                    <div className="doctor-avatar">
                      <img 
                        src={user2}
                        className="doctor-avatar-img"
                      />
                    </div>

                    <div className="doctor-details">
                      <p className="doctor-name">Dr. Evan Baxter</p>
                      <p className="doctor-type">Cardiologist</p>
                    </div>
                  </div>

                  <p className="doctor-time">February 28th 2026</p>
                </div>
              </div>

              <p className="diagnosis-text">Complaint Details</p>
              
              <p className="diagnosis-altext">Primary complaints</p>

              <p className="diagnosis-subtext">Lorem 
              electram postulant appellantur eam at, at nam 
              quas putent iisque. </p>

              <p className="diagnosis-altext">Prior Injuries</p>

              <p className="diagnosis-subtext">Lorem ipsum 
              electram postulant appellantur eam at, at nam 
              quas putent iisque. </p>

              <p className="diagnosis-altext">Activity</p>

              <p className="diagnosis-subtext">Lorem ipsum dolor sit amet, eos verterem nominati in, 
              quas putent iisque. </p>

              <div className="diagnosis-scale">
                <div className="diagnosis-side">
                  <p className="diagnosis-text">Severity</p>
                  <p className="diagnosis-subtext" style={{position: "relative", bottom: "12px"}}>Level</p>
                </div>

                <div className="diagnosis-img">
                  <img 
                    src={scale} 
                    alt="Scale" 
                    className="scale-img"
                  />
                </div>

                <div>
                  <p className="diagnosis-text">9/10</p>
                  <p className="diagnosis-subtext" style={{position: "relative", bottom: "12px"}}>On Pain Scale</p>
                </div>
              </div>
            </div>

            <div className="doctor">
              <div className="doctor-item">
                <div className="doctor-profile">
                  <div className="doctor-avatar">
                    <img 
                      src={user2}
                      className="doctor-avatar-img"
                    />
                  </div>

                  <div className="doctor-details">
                    <p className="doctor-name">Dr. Evan Baxter</p>
                    <p className="doctor-type">Cardiologist</p>
                  </div>
                </div>

                <p className="doctor-time">February 28th 2026</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'treatment' && (
          <div className="card lrg" style={{background: "#FFFFFF", border: "0"}}>
            <div className="card-header">
              <h2 className="card-title">Treatment Plan</h2>
            </div>
            <p>Treatment plan content goes here...</p>
          </div>
        )}
      </div>
    </div>
  )
}