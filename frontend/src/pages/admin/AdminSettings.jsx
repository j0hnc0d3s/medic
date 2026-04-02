import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import './AdminSettings.css'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    birthdayGreetings: {
      enabled: false,
      emailTemplate: {
        subject: 'Happy Birthday from Medic Clinic! 🎉',
        body: `Dear {firstName},

Wishing you a wonderful birthday! 🎂

We hope you have an amazing day filled with joy and celebration.

Best wishes,
The Medic Clinic Team`
      },
      smsEnabled: false,
      smsTemplate: 'Happy Birthday {firstName}! - Medic Clinic'
    },
    clinicInfo: {
      name: 'Medic Clinic',
      address: '',
      phone: '',
      email: '',
      logoURL: ''
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'clinic_settings')
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setSettings(docSnap.data())
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading settings:', error)
      setLoading(false)
    }
  }

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleNestedChange = (section, parent, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...prev[section][parent],
          [field]: value
        }
      }
    }))
  }

  const saveSettings = async () => {
    setSaving(true)

    try {
      const docRef = doc(db, 'settings', 'clinic_settings')
      
      // Check if document exists
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        await updateDoc(docRef, settings)
      } else {
        await setDoc(docRef, settings)
      }

      alert('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="settings loading">
        <div className="loading-spinner">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="settings">
      <div className="setting">
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>

          <button 
            className="btn btn-primary"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </header>

        {/* Birthday Greetings */}
        <div className="settings-card">
          <div className="card-header">
            <div>
              <h3 className="settings-title">Birthday Greetings</h3>
              <p className="card-description">
                Automatically send birthday greetings to patients
              </p>
            </div>

            <div className="toggle-group">
              <input
                type="checkbox"
                id="enable-birthday"
                className="toggle-checkbox"
                checked={settings.birthdayGreetings.enabled}
                onChange={(e) => handleChange('birthdayGreetings', 'enabled', e.target.checked)}
              />

              <label htmlFor="enable-birthday" className="toggle-label">
                Enable automatic birthday greetings
              </label>
            </div>
          </div>

          {settings.birthdayGreetings.enabled && (
            <>
              <div className="form-group">
                <label className="form-label">Email Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.birthdayGreetings.emailTemplate.subject}
                  onChange={(e) => handleNestedChange('birthdayGreetings', 'emailTemplate', 'subject', e.target.value)}
                  placeholder="Happy Birthday!"
                />
              </div>

              <div className="form-group">

                <label className="form-label">Email Message</label>
                <textarea
                  className="form-textarea"
                  value={settings.birthdayGreetings.emailTemplate.body}
                  onChange={(e) => handleNestedChange('birthdayGreetings', 'emailTemplate', 'body', e.target.value)}
                  placeholder="Dear {firstName},..."
                  rows="8"
                />
                <div className="form-hint">
                  Available variables: <code>{'{firstName}'}</code>, <code>{'{lastName}'}</code>
                </div>
              </div>

              <div className="divider" />

              <div className="toggle-group row">
                <div>
                  <h3 className="settings-title">Activate SMS</h3>

                  <p className="card-description">
                    This activates a charge to your account.
                  </p>
                </div>

                <div className="toggle-group">
                  <input
                    type="checkbox"
                    id="enable-sms"
                    className="toggle-checkbox"
                    checked={settings.birthdayGreetings.smsEnabled}
                    onChange={(e) => handleChange('birthdayGreetings', 'smsEnabled', e.target.checked)}
                  />

                  <label htmlFor="enable-sms" className="toggle-label">
                    Enable SMS greetings (costs $0.05 per message)
                  </label>
                </div>
              </div>

              {settings.birthdayGreetings.smsEnabled && (
                <div className="form-group">
                  <label className="form-label">SMS Message (160 characters max)</label>
                  <textarea
                    className="form-textarea"
                    value={settings.birthdayGreetings.smsTemplate}
                    onChange={(e) => handleChange('birthdayGreetings', 'smsTemplate', e.target.value)}
                    placeholder="Happy Birthday {firstName}!"
                    rows="3"
                    maxLength="160"
                  />
                  <div className="form-hint">
                    {settings.birthdayGreetings.smsTemplate.length}/160 characters
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Clinic Information */}
        <div className="settings-card">
          <div className="card-header clinic">
            <h3 className="settings-title">Clinic Information</h3>

            <p className="card-description">
              Used in reports, emails, and patient summaries
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Clinic Name</label>

              <input
                type="text"
                className="form-input"
                value={settings.clinicInfo.name}
                onChange={(e) => handleChange('clinicInfo', 'name', e.target.value)}
                placeholder="Medic Clinic"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={settings.clinicInfo.phone}
                onChange={(e) => handleChange('clinicInfo', 'phone', e.target.value)}
                placeholder="+1 876-555-0000"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                value={settings.clinicInfo.address}
                onChange={(e) => handleChange('clinicInfo', 'address', e.target.value)}
                placeholder="123 Healthcare Ave, Kingston, Jamaica"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={settings.clinicInfo.email}
                onChange={(e) => handleChange('clinicInfo', 'email', e.target.value)}
                placeholder="info@medicclinic.com"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Logo URL (optional)</label>
              <input
                type="url"
                className="form-input"
                value={settings.clinicInfo.logoURL}
                onChange={(e) => handleChange('clinicInfo', 'logoURL', e.target.value)}
                placeholder="https://..."
              />
              <div className="form-hint">
                Upload your logo to a service like Cloudinary and paste the URL here
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-body">
              <h3 className="settings-title">User Management</h3>

              <p className="card-description">
                Manage staff access to the system
              </p>
            </div>

            <button className="btn btn-primary">
              + Add Staff User
            </button>
          </div>

          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">No staff users yet</div>
            <div className="empty-subtext">
              Add staff members to give them access to patient records
            </div>
          </div>
        </div>

        {/* Save Button (Bottom) */}
        <div className="settings-footer">
          <button 
            className="btn btn-primary btn-lg"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}