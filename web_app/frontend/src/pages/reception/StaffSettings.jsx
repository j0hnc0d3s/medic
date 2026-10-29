// ─────────────────────────────────────────────────────────
// FILE : src/pages/reception/StaffSettings.jsx
// CSS  : src/pages/staff/NurseSettings.css (shared -- same .ns-* classes)
//
// Same settings shape as NurseSettings.jsx (notifications table,
// view/landing-page prefs, password change, all backed by the same
// users/{uid} doc) with StaffSidebar in place of NurseSidebar, and
// the notification categories trimmed to what a receptionist
// actually has (appointments only -- no messaging/labs/tasks here).
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword } from 'firebase/auth'
import { db, auth } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import StaffSidebar from './StaffSidebar'
import '../staff/NurseSettings.css'

const NOTIF_CATEGORIES = [
  { key: 'appointment', label: 'Appointments', hint: 'New bookings, cancellations, and reminders' },
]

const CHANNELS = [
  { key: 'inApp', label: 'In-app' },
  { key: 'email', label: 'Email' },
]

const DEFAULT_PREFS = {
  appointment: { inApp: true, email: true },
}

const VIEW_OPTIONS = [
  { key: 'list', label: 'List' },
  { key: 'grid', label: 'Grid' },
]

export default function StaffSettings() {
  const { userProfile } = useAuth()

  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [defaultView, setDefaultView] = useState('list')
  const [landingPage, setLandingPage] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState(null)

  useEffect(() => {
    if (!userProfile?.uid) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userProfile.uid))
        if (snap.exists()) {
          const data = snap.data()
          const stored = data.notificationPreferences || {}
          setPrefs(p => {
            const next = { ...p }
            Object.keys(next).forEach(k => {
              if (typeof stored[k] === 'boolean') next[k] = { ...next[k], inApp: stored[k] }
              else if (stored[k]) next[k] = { ...next[k], ...stored[k] }
            })
            return next
          })
          setDefaultView(data.preferences?.defaultView || 'list')
          setLandingPage(data.preferences?.landingPage || 'overview')
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userProfile?.uid])

  const toggleChannel = (category, channel) => {
    setPrefs(p => ({ ...p, [category]: { ...p[category], [channel]: !p[category][channel] } }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const flatForService = {}
      Object.entries(prefs).forEach(([k, v]) => { flatForService[k] = v.inApp })

      await updateDoc(doc(db, 'users', userProfile.uid), {
        notificationPreferences: flatForService,
        notificationChannels: prefs,
        preferences: { defaultView, landingPage },
      })
      setSaved(true)
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordMsg(null)
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    try {
      await updatePassword(auth.currentUser, newPassword)
      setPasswordMsg({ type: 'success', text: 'Password updated.' })
      setNewPassword('')
    } catch (err) {
      console.error('Password update failed:', err)
      setPasswordMsg({
        type: 'error',
        text: err.code === 'auth/requires-recent-login'
          ? 'For security, please log out and back in before changing your password.'
          : 'Failed to update password.',
      })
    }
  }

  return (
    <div className="no-shell">
      <StaffSidebar />

      <div className="no-main">
        <h1 className="ns-settings-title">Settings</h1>

        {loading ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading settings…</p>
        ) : (
          <div className="ns-settings-grid">

            <div className="ns-settings-card">
              <h2 className="ns-settings-card-title">Notifications</h2>
              <p className="ns-settings-card-sub">Choose what you're notified about, and how.</p>

              <div className="ns-notif-table">
                <div className="ns-notif-row ns-notif-row--head">
                  <span></span>
                  {CHANNELS.map(c => <span key={c.key} className="ns-notif-channel-label">{c.label}</span>)}
                </div>
                {NOTIF_CATEGORIES.map(cat => (
                  <div key={cat.key} className="ns-notif-row">
                    <div>
                      <p className="ns-notif-label">{cat.label}</p>
                      <p className="ns-notif-hint">{cat.hint}</p>
                    </div>
                    {CHANNELS.map(ch => (
                      <button key={ch.key}
                        className={`ns-toggle${prefs[cat.key]?.[ch.key] ? ' on' : ''}`}
                        onClick={() => toggleChannel(cat.key, ch.key)}
                        aria-label={`${cat.label} ${ch.label} notifications`}>
                        <span className="ns-toggle-knob" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <p className="ns-settings-note">
                Email delivery isn't wired up yet — the toggle is saved, but only in-app notifications actually send right now.
              </p>
            </div>

            <div className="ns-settings-card">
              <h2 className="ns-settings-card-title">Preferences</h2>

              <div className="ns-pref-row">
                <p className="ns-notif-label">Default view</p>
                <div className="ns-segmented">
                  {VIEW_OPTIONS.map(o => (
                    <button key={o.key}
                      className={`ns-segmented-btn${defaultView === o.key ? ' active' : ''}`}
                      onClick={() => setDefaultView(o.key)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ns-pref-row">
                <p className="ns-notif-label">Landing page</p>
                <select className="ns-select" value={landingPage} onChange={e => setLandingPage(e.target.value)}>
                  <option value="overview">Overview</option>
                  <option value="patients">Patients</option>
                  <option value="appointments">Appointments</option>
                </select>
              </div>
            </div>

            <div className="ns-settings-card">
              <h2 className="ns-settings-card-title">Security</h2>

              <div className="ns-pref-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <input className="ns-text-input" type="password" placeholder="New password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                {passwordMsg && (
                  <p className={`ns-password-msg ${passwordMsg.type}`}>{passwordMsg.text}</p>
                )}
                <button className="ns-btn ns-btn--secondary" onClick={handlePasswordChange}>
                  Update password
                </button>
              </div>
            </div>

            <div className="ns-settings-footer">
              <button className="ns-btn ns-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
