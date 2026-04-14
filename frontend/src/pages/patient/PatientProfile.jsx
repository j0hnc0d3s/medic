import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

import '../styles/PatientProfile.css'

import test from '../../assets/images/test.png';
import top from '../../assets/images/top.png';
import document from '../../assets/images/document.png';
import upload from '../../assets/images/upload.png';
import dots from '../../assets/images/dots.png';
import next from '../../assets/images/next.png';
import close from '../../assets/images/close.png';
import edit from '../../assets/images/edit.png';


import scale from '../../assets/images/scale.png';
import user1 from '../../assets/images/user1.jpeg';
import user2 from '../../assets/images/user2.jpg';

const NAV_ITEMS = [
  {
    label: 'About Me',
    id: 'aboutme',
  },
  {
    label: 'Treatment Plan',
    id: 'treatment',
  },
  {
    label: 'Documents',
    id: 'documents',
  },
  {
    label: 'Labs/Test',
    id: 'labtest',
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
    <div className="profile-dashboard">
      <div className="profile-sidebar-left">
        <div className="profile-image">
            <img 
                src={user1} 
                alt="Profile Image" 
                className="profile-img"
            />

            <div className="profile-bubble-edit-1">
                <div className="profile-bubble-edit-area">
                    <img 
                        src={edit}
                        alt="Edit Image"
                        className="profile-edit-img" 
                    />
                </div>
            </div>

        </div>

        <div className="profile-card" style={{background: "#FFFFFF", border: "0"}}>
          <div className="profile-card-body">
            <div className="profile-card-info">
              <h2 className="profile-card-title">Liam Carter</h2>
              <h3 className="profile-card-subtitle">Patient</h3>
            </div>

            <div className="profile-card-info">
              <h3 className="profile-card-subtitle">+1 (876) 208-2517</h3>
              <h3 className="profile-card-subtitle">josiahjohngreen@gmail.com</h3>
            </div>

            <div className="profile-bubble-edit-2">
                <div className="profile-bubble-edit-area">
                    <img 
                        src={edit}
                        alt="Edit Image"
                        className="profile-edit-img" 
                    />
                </div>
            </div>
          </div>
        </div>

        <div className="profile-card" style={{background: "#FFFFFF", border: "0"}}>
          <div className="profile-card-body">
            <h2 className="profile-card-title">Measurement</h2>
            <h2 className="profile-card-subtitle">179 kg</h2>  
            <h2 className="profile-card-subtitle">6'2 (163 cm)</h2>            
          </div>
          
          <div className="profile-card-body">
            <h2 className="profile-card-title">Blood Type</h2>
            <h2 className="profile-card-subtitle">A-</h2>            
          </div>

          <div className="profile-card-body">
            <h2 className="profile-card-title">Age</h2>
            <h2 className="profile-card-subtitle">30 years old</h2>            
          </div>

          <div className="profile-card-body">
            <h2 className="profile-card-title">BMI</h2>
            <h2 className="profile-card-subtitle">17.2</h2>   
            <h2 className="profile-card-subtitle">Underweight</h2>            
          </div>

          <div className="profile-bubble-edit-3">
            <div className="profile-bubble-edit-area">
                <img 
                    src={edit}
                    alt="Edit Image"
                    className="profile-edit-img" 
                />
            </div>
          </div>
        </div>

        <div className="profile-card" style={{background: "#FFFFFF", border: "0"}}>
          <div className="profile-card-body">
            <h2 className="profile-card-title">Notes</h2>
            <h2 className="profile-card-subtitle">Lorem ipsum tan dem ret.</h2>         
          </div>

          <div className="profile-bubble-edit-4">
            <div className="profile-bubble-edit-area">
                <img 
                    src={edit}
                    alt="Edit Image"
                    className="profile-edit-img" 
                />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-sidebar-right">
        <div className="profile-menu">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`profile-menu-area ${activeTab === item.id ? 'active' : ''}`}
            >
              <span className="profile-menu-label">{item.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'aboutme' && (
            <div className="profile-body">
                <div className="profile-descriptions">
                    <div className="profile-description">
                        <h2 className="profile-description-title">About the Patient</h2>
                        <h2 className="profile-description-subtitle">
                            Liam Carter is a ipsum dolor sit amet, consectetur adipiscing elit. <br/> <br/>
                            Sed consequat ante ipsum, eu pellentesque nibh aliquet non. Suspendisse et luctus ante. Integer ornare consectetur purus non lobortis. <br/><br/>
                            Phasellus ut nibh vitae metus consequat aliquet. Sed a felis eros. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec lacinia erat odio, <br/><br/> eget venenatis nisi feugiat non. Integer vehicula metus erat, at malesuada sem bibendum a. Aenean libero metus, mollis eu neque eget, accumsan aliquet neque. Sed interdum, tellus vitae mollis eleifend, turpis purus porta est, <br/><br/> vitae porta orci dolor varius mi. 
                            Cras vitae facilisis magna, ac rutrum nulla. Nunc at nulla molestie, pellentesque lorel. 
                        </h2>
                    </div>

                    <div className="profile-items">
                        <div className="profile-description-item">
                            <h2 className="profile-description-title">Allergies</h2>

                            <div className="profile-bubbles">
                                <div className="profile-bubble">
                                    <h2 className="profile-bubble-text">Diarahea</h2>

                                    <div className="profile-bubble-close-1">
                                        <div className="profile-bubble-close-area">
                                            <img 
                                                src={close}
                                                alt="Close Image"
                                                className="profile-close-img" 
                                            />
                                        </div>
                                    </div>
                                </div> 
                            </div>
                        </div>

                        <div className="profile-description-item">
                            <h2 className="profile-description-title">Current Medication</h2>

                            <div className="profile-bubbles">
                                <div className="profile-bubble">
                                    <h2 className="profile-bubble-text">Diarahea</h2>

                                    <div className="profile-bubble-close-2">
                                        <div className="profile-bubble-close-area">
                                            <img 
                                                src={close}
                                                alt="Close Image"
                                                className="profile-close-img" 
                                            />
                                        </div>
                                    </div>
                                </div> 
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-descriptions">
                    <div className="profile-description">
                        <h2 className="profile-description-title">Family History</h2>
                        <h2 className="profile-description-subtitle">
                            Liam Carter is a ipsum dolor sit amet. <br/><br/>
                              1. Phasellus ut—nibh vitae metus consequat aliquet. Sed a felis eros. Interdum et malesuada fames ac ante ipsum. <br/><br/>
                              2. Integer vehicula—metus erat, at malesuada sem bibendum a. Aenean tellus vitae mollis eleifend, turpis purus porta est, vitae porta orci dolor varius mi. <br/><br/>

                            Cras vitae facilisis magna, ac rutrum nulla. Nunc at nulla molestie, pellentesque lorem vel, tincidunt augue. 
                        </h2>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'treatment' && (
          <div className="profile-description">
            
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="profile-description">

          </div>
        )}

        {activeTab === 'labstest' && (
          <div className="profile-description">

          </div>
        )}
      </div>
    </div>
  )
}