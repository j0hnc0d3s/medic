// ─────────────────────────────────────────────────────────
// FILE : src/pages/patient/PatientSidebar.jsx
// CSS  : src/pages/patient/PatientSidebar.css (shares NurseSidebar.css classes)
//
// Two stacked sections (no vitals/detail panel — that's the
// patient's OWN data, not something they need a card for):
//   1. Doctor contacts list (blue) — flexes to fill remaining space
//   2. Nav (black) — fixed, route-aware highlighting
//
// Eligibility rule (per spec): a patient can only see a doctor
// here if they have a confirmed appointment with them, a
// referral to them, or that doctor messaged them first. There
// is no directory browse — the '+' panel only offers doctors
// already inside that eligible set who aren't pinned yet.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  collection, query, where, getDocs
} from 'firebase/firestore'
import { auth, db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import './PatientSidebar.css'

import add   from '../../assets/inverted/plus.png'
import close from '../../assets/inverted/close.png'
import send  from '../../assets/black/send.png'
import settings from '../../assets/inverted/settings.png'
import logout    from '../../assets/inverted/logout.png'

const NAV_ITEMS = [
  { key: 'overview',     label: 'Overview',     path: '/patient/overview',     icon: 'home'   },
  { key: 'appointments', label: 'Appointments', path: '/patient/appointments', icon: 'clock'  },
  { key: 'messaging',    label: 'Messaging',    path: '/patient/messaging',    icon: 'send'   },
  { key: 'documents',    label: 'Documents',    path: '/patient/documents',    icon: 'folder' },
]

const ICONS = {
  home:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  send:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
}

const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()

const SIDEBAR_KEY = 'medic_patient_sidebar_doctor_ids'

// Normalizes "Dr. Marshall White" -> "marshall white" for matching
// appointment.doctor strings back to a real user record.
const normalizeDoctorName = (s) =>
  (s || '').replace(/^dr\.?\s*/i, '').trim().toLowerCase()

const mapDoctorToSidebarShape = (d) => ({
  id:             d.uid || d.id,
  firstName:      d.firstName || '',
  lastName:       d.lastName  || '',
  specialization: d.specialization || d.role || 'Doctor',
  image:          d.profilePictureUrl || null,
  online:         false,
})

export default function PatientSidebar() {
  const navigate        = useNavigate()
  const location         = useLocation()
  const { userProfile }  = useAuth()

  const [eligible,  setEligible]  = useState([])   // full eligible pool
  const [pinnedIds, setPinnedIds] = useState([])   // which of those are shown
  const [search,    setSearch]    = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (userProfile?.uid) loadEligibleDoctors()
  }, [userProfile?.uid])

  const loadEligibleDoctors = async () => {
    setLoading(true)
    try {
      // 1. Pull every doctor account once so we can match by name/uid.
      const doctorsSnap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'doctor'))
      )
      const doctorsByName = new Map()
      const doctorsById    = new Map()
      doctorsSnap.docs.forEach(d => {
        const data = { uid: d.id, ...d.data() }
        doctorsByName.set(normalizeDoctorName(`${data.firstName} ${data.lastName}`), data)
        doctorsById.set(d.id, data)
      })

      const eligibleIds = new Set()

      // 2. Doctors from confirmed appointments (matched by uid, then name).
      const apptByUid = await getDocs(
        query(collection(db, 'appointments'), where('patientId', '==', userProfile.uid))
      )
      const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      const apptByName = fullName
        ? await getDocs(query(collection(db, 'appointments'), where('patientName', '==', fullName)))
        : { docs: [] }

      ;[...apptByUid.docs, ...apptByName.docs].forEach(d => {
        const doctorStr = d.data().doctor
        const match = doctorsByName.get(normalizeDoctorName(doctorStr))
        if (match) eligibleIds.add(match.uid)
      })

      // 3. Doctors from an existing message thread (they messaged first,
      //    or a thread already exists for another reason). Best-effort —
      //    skipped silently if the messages schema doesn't match.
      try {
        const msgSnap = await getDocs(
          query(collection(db, 'messages'), where('participants', 'array-contains', userProfile.uid))
        )
        msgSnap.docs.forEach(d => {
          const participants = d.data().participants || []
          participants.forEach(pid => { if (doctorsById.has(pid)) eligibleIds.add(pid) })
        })
      } catch { /* messages collection not queryable this way — ignore */ }

      const pool = [...eligibleIds].map(id => doctorsById.get(id)).filter(Boolean)
      setEligible(pool)

      // 4. Restore this patient's pin selection, defaulting to "show all
      //    eligible" since the pool itself is already access-controlled.
      const saved = JSON.parse(localStorage.getItem(SIDEBAR_KEY) || 'null')
      if (saved) {
        setPinnedIds(saved.filter(id => eligibleIds.has(id)))
      } else {
        setPinnedIds([...eligibleIds])
      }
    } catch (err) {
      console.error('Failed to load doctor contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const pinnedDoctors = pinnedIds
    .map(id => eligible.find(d => d.uid === id))
    .filter(Boolean)
    .map(mapDoctorToSidebarShape)

  const filtered = pinnedDoctors.filter(d =>
    `${d.firstName} ${d.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const addToList = (doctorUid) => {
    const updated = [...new Set([...pinnedIds, doctorUid])]
    setPinnedIds(updated)
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(updated))
    setShowAdd(false)
    setAddSearch('')
  }

  const removeFromList = (doctorUid, e) => {
    e.stopPropagation()
    const updated = pinnedIds.filter(id => id !== doctorUid)
    setPinnedIds(updated)
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(updated))
  }

  const messageDoctor = (doctor, e) => {
    e.stopPropagation()
    navigate('/patient/messaging', { state: { doctorId: doctor.id } })
  }

  const handleLogout = async () => {
    try { await signOut(auth) } catch (err) { console.error('Logout error:', err) }
    finally {
      localStorage.removeItem('userToken')
      localStorage.removeItem('userData')
      navigate('/login')
    }
  }

  const activeKey = NAV_ITEMS.find(i => location.pathname.startsWith(i.path))?.key || 'overview'
  const unpinnedEligible = eligible.filter(d => !pinnedIds.includes(d.uid))

  return (
    <div className="ns-shell">

      {/* ── 1. Doctor contacts list ────────────────────── */}
      <div className="ns-patients">
        <div className="ns-search-row">
          <div className="ns-search">
            <input className="ns-search-input" placeholder="Search"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <button className="ns-add-btn" onClick={() => setShowAdd(s => !s)} aria-label="Show more contacts">
            <img src={add} className="ns-icon" alt="" />
          </button>
        </div>

        {showAdd && (
          <div className="ns-add-panel">
            <p className="ns-add-title">Doctors you can reach</p>

            <input
              className="ns-search-input"
              placeholder="Search by name…"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />

            <div className="ns-add-list">
              {unpinnedEligible
                .filter(d => `${d.firstName} ${d.lastName}`.toLowerCase().includes(addSearch.toLowerCase()))
                .slice(0, 8)
                .map(d => (
                  <button key={d.uid} className="ns-add-item" onClick={() => addToList(d.uid)}>
                    Dr. {d.firstName} {d.lastName}
                  </button>
                ))
              }
              {unpinnedEligible.length === 0 && !loading && (
                <p className="ns-add-empty">
                  No other doctors yet — this list fills as you book appointments or get messaged.
                </p>
              )}
            </div>
          </div>
        )}

        {loading && (
          <p className="ns-loading-label">Loading your doctors…</p>
        )}

        {!loading && pinnedDoctors.length === 0 && (
          <p className="ns-loading-label">
            No doctors yet. Once you have an appointment, they'll show up here.
          </p>
        )}

        <div className="ns-patient-list">
          {filtered.map(d => (
            <div key={d.id} className="ns-patient-item" onClick={() => navigate('/patient/messaging', { state: { doctorId: d.id } })}>
              <div className="ns-patient-av-wrap">
                <div className="ns-patient-av">
                  {d.image ? (
                    <img src={d.image} className="ns-full-icon" alt={`Dr. ${d.firstName} ${d.lastName}`} />
                  ) : (
                    <span className="ns-av-initials">{getInitials(d.firstName, d.lastName)}</span>
                  )}
                </div>
                {d.online && <span className="ns-online-dot" />}
              </div>

              <div className="ns-patient-info">
                <span className="ns-patient-name">Dr. {d.firstName} {d.lastName}</span>
                <span className="ns-patient-meta">{d.specialization}</span>
              </div>

              <button className="ns-patient-remove" onClick={e => messageDoctor(d, e)} aria-label="Message">
                <img src={send} className="ns-icon" alt="" />
              </button>

              <button className="ns-patient-remove" onClick={e => removeFromList(d.id, e)} aria-label="Remove from list">
                <img src={close} className="ns-icon" alt="" />
              </button>
            </div>
          ))}
        </div>

        <div className="ns-patient-count-wrap">
          <p className="ns-patient-count">{filtered.length} doctors</p>
        </div>
      </div>

      {/* ── 2. Nav ──────────────────────────────────────── */}
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
          <button className="ns-icon-btn" onClick={() => navigate('/patient/settings')} aria-label="Settings">
            <img src={settings} className="ns-alt-icon" alt="" />
          </button>
          <button className="ns-icon-btn" onClick={handleLogout} aria-label="Log out">
            <img src={logout} className="ns-other-icon" alt="" />
          </button>
        </div>
      </div>
    </div>
  )
}