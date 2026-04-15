import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

import '../styles/Settings.css'

import on from '../../assets/images/on.png';
import off from '../../assets/images/off.png';

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
    <>
        <div className="settings">
            <div className="settings-container">
                <div className="settings-header">
                    <h2 className="settings-header-title">Settings</h2>
                </div>

                <div className="settings-body">
                    <div className="settings-body-section">
                        <div className="settings-body-section-header">
                            <div className="settings-body-title">Notifications</div>
                            <div className="settings-body-subtitle">Config your notification preferences</div>
                        </div>

                        <div className="settings-body-area">
                            <div className="settings-body-content">
                                <div className="settings-body-text-area">
                                    <div className="settings-body-text">Appointment Reminders</div>
                                    <div className="settings-body-subtext">Change whether or not you'd like to receive reminders for appointments</div>
                                </div>

                                <div className="settings-body-toggle">
                                    <img 
                                        src={on}
                                        alt="On"
                                        className="settings-on-img"
                                    />
                                </div>
                            </div>

                            <div className="settings-body-content">
                                <div className="settings-body-text-area">
                                    <div className="settings-body-text">Message Notifications</div>
                                    <div className="settings-body-subtext">Choose whether or not you'd like to receive message notifications</div>
                                </div>

                                <div className="settings-body-toggle">
                                    <img 
                                        src={off}
                                        alt="Off"
                                        className="settings-off-img"
                                    />
                                </div>
                            </div>

                            <div className="settings-body-content">
                                <div className="settings-body-text-area">
                                    <div className="settings-body-text">Birthday Greetings</div>
                                    <div className="settings-body-subtext">Choose whether or not you'd like to receive birthday greetings</div>
                                </div>

                                <div className="settings-body-toggle">
                                    <img 
                                        src={off}
                                        alt="Off"
                                        className="settings-off-img"
                                    />
                                </div>
                            </div>

                            <div className="settings-body-content">
                                <div className="settings-body-text-area">
                                    <div className="settings-body-text">Email Notifications</div>
                                    <div className="settings-body-subtext">Choose whether or not you'd like to receive email notifications</div>
                                </div>


                                <div className="settings-body-toggle">
                                    <img 
                                        src={off}
                                        alt="Off"
                                        className="settings-off-img"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="settings-body-section">
                        <div className="settings-body-section-header">
                            <div className="settings-body-title">Privacy</div>
                            <div className="settings-body-subtitle">Config your privacy preferences</div>
                        </div>

                        <div className="settings-body-area">
                            <div className="settings-body-content">
                                <div className="settings-body-text-area">
                                    <div className="settings-body-text">Allow SMS messages</div>
                                    <div className="settings-body-subtext">Allow SMS messages to be sent to your phone</div>
                                </div>

                                <div className="settings-body-toggle">
                                    <img 
                                        src={on}
                                        alt="On"
                                        className="settings-on-img"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="settings-body-section">
                        <div className="settings-body-section-header">
                            <div className="settings-body-title">Appearance</div>
                            <div className="settings-body-subtitle">Config your appearance preferences</div>
                        </div>

                        <div className="settings-body-area">
                            <div className="settings-body-content">
                                <div className="settings-body-text-area">
                                    <div className="settings-body-text">Dark mode</div>
                                    <div className="settings-body-subtext">Change the theme of your application</div>
                                </div>

                                <div className="settings-body-toggle">
                                    <img 
                                        src={off}
                                        alt="Off"
                                        className="settings-off-img"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  )
}