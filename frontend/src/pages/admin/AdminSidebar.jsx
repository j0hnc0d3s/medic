// ─────────────────────────────────────────────────────────
// FILE : src/pages/admin/AdminSidebar.jsx
// CSS  : src/pages/staff/NurseSidebar.css (shared — same .ns-* classes)
//
// Same shell as NurseSidebar: a blue patients section (search, add,
// pinned list, count) over a black nav. The patient list itself is
// identical in look and behavior — same shared feature, not a
// "different tab" — only the nav below differs: Admin gets its own
// shorter set (Overview/Finances/Patients/Messaging) instead of the
// full clinical-workflow tabs, and no dark clinical detail panel,
// since that's nurse-facing depth admin doesn't manage day-to-day.
// Clicking a patient just navigates to the Patients page.
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { patientService } from '../../services'
import notificationService from '../../services/notificationService'
import '../staff/NurseSidebar.css'

import add from '../../assets/inverted/plus.png'
import close from '../../assets/inverted/close.png'
import settings from '../../assets/inverted/settings.png'
import logout from '../../assets/inverted/logout.png'

const NAV_ITEMS = [
  { key: 'overview',  label: 'Overview',  path: '/admin/overview',  icon: 'home'    },
  { key: 'finances',  label: 'Finances',  path: '/admin/finances',  icon: 'finance' },
  { key: 'patients',  label: 'Patients',  path: '/admin/patients',  icon: 'user'    },
  { key: 'messaging', label: 'Messaging', path: '/admin/messaging', icon: 'send'    },
]

const ICONS = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  finance: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  send: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
}

const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()

// Separate pinned-list key from the nurse sidebar's — different
// role, shouldn't share or clobber the same localStorage entry even
// if the same browser is somehow used for both.
const SIDEBAR_KEY = 'medic_admin_sidebar_patient_ids'

const mapToSidebarShape = (p) => ({
  id:        p.uid || p.id,
  firstName: p.firstName || '',
  lastName:  p.lastName  || '',
  gender:    p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : 'Unknown',
  image:     p.profilePictureUrl || null,
})

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [patients, setPatients]       = useState([])
  const [allPatients, setAllPatients] = useState([])
  const [search, setSearch]           = useState('')
  const [showAdd, setShowAdd]         = useState(false)
  const [addSearch, setAddSearch]     = useState('')
  const [loading, setLoading]         = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { loadAllPatients() }, [])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const refresh = () => {
      notificationService.getUnreadCount(uid).then(res => {
        if (res.success) setUnreadCount(res.count)
      })
    }
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAllPatients = async () => {
    setLoading(true)
    try {
      const res = await patientService.getPatients()
      if (!res.success) return
      const all = res.patients || []
      setAllPatients(all)

      const savedIds = JSON.parse(localStorage.getItem(SIDEBAR_KEY) || '[]')
      if (savedIds.length > 0) {
        const pinned = savedIds
          .map(id => all.find(p => (p.uid || p.id) === id))
          .filter(Boolean)
          .map(mapToSidebarShape)
        setPatients(pinned)
      }
    } catch (err) {
      console.error('Failed to load patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const removeFromList = (id, e) => {
    e.stopPropagation()
    const updated = patients.filter(x => x.id !== id)
    setPatients(updated)
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(updated.map(x => x.id)))
  }

  const addPatientToList = (p) => {
    const shaped = mapToSidebarShape(p)
    if (patients.find(x => x.id === shaped.id)) { setShowAdd(false); return }
    const updated = [...patients, shaped]
    setPatients(updated)
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(updated.map(x => x.id)))
    setShowAdd(false)
    setAddSearch('')
  }

  const handleLogout = async () => {
    try { await signOut(auth) } catch (err) { console.error('Logout error:', err) }
    finally { navigate('/login') }
  }

  const activeKey = NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.key
    || (location.pathname.startsWith('/admin/notifications') ? 'notifications' : 'overview')

  return (
    <div className="ns-shell">

      {/* ── Patients list (same shared feature as NurseSidebar) ── */}
      <div className="ns-patients">
        <div className="ns-search-row">
          <div className="ns-search">
            <input className="ns-search-input" placeholder="Search"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="ns-add-btn" onClick={() => setShowAdd(s => !s)} aria-label="Add patient">
            <img src={add} className="ns-icon"/>
          </button>
        </div>

        {showAdd && (
          <div className="ns-add-panel">
            <p className="ns-add-title">Add a patient to view</p>
            <input
              className="ns-search-input"
              placeholder="Search by name…"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div className="ns-add-list">
              {allPatients
                .filter(p => `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(addSearch.toLowerCase()))
                .filter(p => !patients.find(x => x.id === (p.uid || p.id)))
                .slice(0, 8)
                .map(p => (
                  <button key={p.uid || p.id} className="ns-add-item" onClick={() => addPatientToList(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              {allPatients.filter(p => !patients.find(x => x.id === (p.uid || p.id))).length === 0
                && !loading && <p className="ns-add-empty">All patients are already added</p>}
              {allPatients.length === 0 && !loading
                && <p className="ns-add-empty">No patients found in system</p>}
            </div>
          </div>
        )}

        {loading && <p className="ns-loading-label">Loading patients…</p>}
        {!loading && patients.length === 0 && (
          <p className="ns-loading-label">No patients added. Use + to add a patient.</p>
        )}

        <div className="ns-patient-list">
          {filtered.map(p => (
            <div key={p.id} className="ns-patient-item"
              onClick={() => navigate('/admin/patients')}>
              <div className="ns-patient-av-wrap">
                <div className="ns-patient-av">
                  {p.image ? (
                    <img src={p.image} className="ns-full-icon" alt={`${p.firstName} ${p.lastName}`} />
                  ) : (
                    <span className="ns-av-initials">{getInitials(p.firstName, p.lastName)}</span>
                  )}
                </div>
              </div>
              <div className="ns-patient-info">
                <span className="ns-patient-name">{p.firstName}. {p.lastName}</span>
                <span className="ns-patient-meta">{p.gender}</span>
              </div>
              
              <button className="ns-patient-remove" onClick={e => removeFromList(p.id, e)} aria-label="Remove">
                <img src={close} className="ns-icon"/>
              </button>
            </div>
          ))}
        </div>

        <div className="ns-patient-count-wrap">
          <p className="ns-patient-count">{filtered.length} patients</p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────── */}
      <div className="ns-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.key}
            className={`ns-nav-item${activeKey === item.key ? ' active' : ''}`}
            onClick={() => navigate(item.path)}>
            <div className={`ns-nav-icon${activeKey === item.key ? ' active' : ''}`}>
              {ICONS[item.icon]}
            </div>
            <span className="ns-nav-label">{item.label}</span>
          </button>
        ))}

        <div className="ns-nav-spacer" />

        <div className="ns-nav-footer">
          <button className="ns-icon-btn ns-icon-btn--badge" onClick={() => navigate('/admin/notifications')} aria-label="Notifications">
            {ICONS.bell}
            {unreadCount > 0 && <span className="ns-nav-badge" />}
          </button>
          <button className="ns-icon-btn" onClick={() => navigate('/admin/settings')} aria-label="Settings">
            <img src={settings} className="ns-alt-icon"/>
          </button>
          <button className="ns-icon-btn" onClick={handleLogout} aria-label="Log out">
            <img src={logout} className="ns-other-icon"/>
          </button>
        </div>
      </div>
    </div>
  )
}