// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseMessaging.jsx
// CSS  : src/pages/staff/NurseMessaging.css (+ reuses NurseSidebar.css
//        for the conversation-list column, same .ns-* classes)
//
// Three panels:
//   1. Conversation list (blue, same shell as NurseSidebar's
//      patient list, but listing conversations instead)
//   2. Chat thread (real-time via messagingService listeners)
//   3. Patient quick-info (avatar, quick-links to their other
//      records, Medical History/Medication toggle, Calendar)
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  collection, query, where, getDocs, addDoc, updateDoc,
  doc, orderBy, Timestamp
} from 'firebase/firestore'
import { db, auth } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import messagingService from '../../services/messagingService'
import { patientService } from '../../services'
import Calendar from '../../components/Calendar'
import './NurseSidebar.css'
import './NurseMessaging.css'

import add     from '../../assets/inverted/plus.png'
import close   from '../../assets/inverted/close.png'
import sendImg from '../../assets/black/send.png'
import settings from '../../assets/inverted/settings.png'
import logout    from '../../assets/inverted/logout.png'

const NAV_ITEMS = [
  { key: 'overview',     label: 'Overview',     path: '/staff/overview',     icon: 'home'  },
  { key: 'patients',     label: 'Patients',     path: '/staff/patients',     icon: 'user'  },
  { key: 'appointments', label: 'Appointments', path: '/staff/appointments', icon: 'clock' },
  { key: 'messaging',    label: 'Messaging',     path: '/staff/messaging',   icon: 'send'  },
  { key: 'notes',        label: 'Notes',         path: '/staff/notes',        icon: 'note'  },
  { key: 'documents',    label: 'Documents',     path: '/staff/documents',   icon: 'folder'},
  { key: 'imaging',      label: 'Imaging',       path: '/staff/imaging',     icon: 'brain' },
  { key: 'labs',         label: 'Labs',          path: '/staff/labs',        icon: 'flask' },
]

const ICONS = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  send: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  note: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h13l3 3v13a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7a1 1 0 011-1h5l2 2h9a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  brain: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 3a3 3 0 00-3 3v1a3 3 0 00-2 5 3 3 0 002 5v1a3 3 0 006 0V6a3 3 0 00-3-3zM15 3a3 3 0 013 3v1a3 3 0 012 5 3 3 0 01-2 5v1a3 3 0 01-6 0V6a3 3 0 013-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  flask: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H4a2 2 0 110-4h.1a1.7 1.7 0 001.6-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5V4a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1H20a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth="1.5"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  search: <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  dots: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>,
}

const getInitials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase()

const dayKeyOf = (d) => d.toDateString()

const formatDayLabel = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'
  const day = date.getDate()
  const suffix = (day % 10 === 1 && day !== 11) ? 'st'
    : (day % 10 === 2 && day !== 12) ? 'nd'
    : (day % 10 === 3 && day !== 13) ? 'rd' : 'th'
  return `${date.toLocaleDateString('en-US', { month: 'long' })} ${day}${suffix}`
}

const formatTime = (ts) => {
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d)) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const HIDDEN_KEY = 'medic_messaging_hidden_conversations'

export default function NurseMessaging() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userProfile } = useAuth()
  const currentUserId = userProfile?.uid

  // ── Conversations ─────────────────────────────────────────
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [search, setSearch] = useState('')
  const [hiddenIds, setHiddenIds] = useState(() => JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'))

  const [showAdd, setShowAdd] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [patients, setPatients] = useState([])

  // ── Messages ───────────────────────────────────────────────
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)

  // ── Patient quick-info panel ────────────────────────────────
  const [otherPatientRecord, setOtherPatientRecord] = useState(null)
  const [infoTab, setInfoTab] = useState('history') // 'history' | 'medication'

  // ── Calendar (same pattern as NurseOverview) ────────────────
  const [todayAgenda, setTodayAgenda] = useState([])
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    if (!currentUserId) return
    const unsubscribe = messagingService.listenToConversations(currentUserId, setConversations)
    return () => unsubscribe?.()
  }, [currentUserId])

  useEffect(() => {
    patientService.getPatients().then(res => {
      if (res.success) setPatients(res.patients || [])
    }).catch(err => console.error('Failed to load patients:', err))
  }, [])

  useEffect(() => {
    if (!selectedConversation?.id) { setMessages([]); return }
    const unsubscribe = messagingService.listenToMessages(selectedConversation.id, setMessages)
    messagingService.markAsRead(selectedConversation.id, currentUserId)
    return () => unsubscribe?.()
  }, [selectedConversation?.id, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Resolve the other participant's real patient record for the
  // quick-info panel, once a conversation is selected.
  useEffect(() => {
    if (!selectedConversation || !patients.length) { setOtherPatientRecord(null); return }
    const otherId = selectedConversation.participants?.find(id => id !== currentUserId)
    const match = patients.find(p => (p.uid || p.id) === otherId)
    setOtherPatientRecord(match || null)
    setInfoTab('history')
  }, [selectedConversation, patients, currentUserId])

  // ── Today's appointments + tasks for the Calendar widget ───
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
        const snap = await getDocs(query(
          collection(db, 'appointments'),
          where('appointmentDate', '>=', Timestamp.fromDate(today)),
          where('appointmentDate', '<', Timestamp.fromDate(tomorrow)),
          orderBy('appointmentDate')
        ))
        setTodayAgenda(snap.docs.map(d => ({
          id: d.id,
          time: d.data().appointmentTime || '—',
          label: `${d.data().patientName} — ${d.data().type || 'Appointment'}`,
        })))
      } catch { setTodayAgenda([]) }
    }
    fetchToday()
  }, [])

  useEffect(() => {
    if (!currentUserId) return
    getDocs(query(
      collection(db, 'tasks'),
      where('userId', '==', currentUserId),
      where('completed', '==', false),
      orderBy('createdAt', 'desc')
    )).then(snap => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setTasks([]))
  }, [currentUserId])

  const addTask = async () => {
    if (!newTask.trim() || !currentUserId) return
    const data = { userId: currentUserId, label: newTask.trim(), completed: false, createdAt: Timestamp.now() }
    try {
      const ref = await addDoc(collection(db, 'tasks'), data)
      setTasks(t => [{ id: ref.id, ...data }, ...t])
      setNewTask('')
    } catch (err) { console.error('Add task error:', err) }
  }
  const completeTask = async (taskId) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { completed: true })
      setTasks(t => t.filter(x => x.id !== taskId))
    } catch { setTasks(t => t.filter(x => x.id !== taskId)) }
  }

  // ── Conversation list ────────────────────────────────────────
  const visibleConversations = useMemo(() => {
    return conversations
      .filter(c => !hiddenIds.includes(c.id))
      .filter(c => messagingService.getConversationDisplayName(c, currentUserId)
        .toLowerCase().includes(search.toLowerCase()))
  }, [conversations, hiddenIds, search, currentUserId])

  const hideConversation = (id, e) => {
    e.stopPropagation()
    const updated = [...hiddenIds, id]
    setHiddenIds(updated)
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(updated))
    if (selectedConversation?.id === id) setSelectedConversation(null)
  }

  const startConversation = async (patient) => {
    const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
    const res = await messagingService.getOrCreateConversation(currentUserId, patient.uid || patient.id, {
      user1Name: staffName,
      user1Role: userProfile?.role || 'staff',
      user2Name: `${patient.firstName} ${patient.lastName}`,
      user2Role: 'patient',
    })
    if (res.success) {
      setSelectedConversation(res.conversation)
      setShowAdd(false)
      setAddSearch('')
    }
  }

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConversation) return
    const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
    const text = messageText
    setMessageText('')
    await messagingService.sendMessage(selectedConversation.id, {
      text, senderId: currentUserId, senderName: staffName, senderRole: userProfile?.role || 'staff',
    })
  }

  const handleLogout = async () => {
    try { await signOut(auth) } catch (err) { console.error('Logout error:', err) }
    finally { navigate('/login') }
  }

  const activeKey = NAV_ITEMS.find(i => location.pathname.startsWith(i.path))?.key || 'messaging'

  // ── Message grouping with date dividers ─────────────────────
  const messageGroups = useMemo(() => {
    const groups = []
    let lastDay = null
    messages.forEach(m => {
      const d = m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp)
      const key = dayKeyOf(d)
      if (key !== lastDay) {
        groups.push({ type: 'divider', label: formatDayLabel(d), key: `divider-${key}` })
        lastDay = key
      }
      groups.push({ type: 'message', data: m, key: m.id })
    })
    return groups
  }, [messages])

  const otherName = selectedConversation
    ? messagingService.getConversationDisplayName(selectedConversation, currentUserId)
    : ''

  const medicalHistory = otherPatientRecord?.medicalHistory || []
  const latestConsultation = medicalHistory
    .filter(h => h.type === 'Consultation')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
  const medications = (otherPatientRecord?.medications || [])
    .map(m => typeof m === 'string' ? { name: m } : m)

  return (
    <div className="no-msg-shell">

      {/* ── 1. Conversation list (reuses NurseSidebar's shell) ── */}
      <div className="ns-shell">
        <div className="ns-patients">
          <div className="ns-search-row">
            <div className="ns-search">
              <input className="ns-search-input" placeholder="Search"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="ns-add-btn" onClick={() => setShowAdd(s => !s)} aria-label="New conversation">
              <img src={add} className="ns-icon" alt="" />
            </button>
          </div>

          {showAdd && (
            <div className="ns-add-panel">
              <p className="ns-add-title">Start a conversation</p>
              <input className="ns-search-input" placeholder="Search by name…"
                value={addSearch} onChange={e => setAddSearch(e.target.value)}
                style={{ marginBottom: 8 }} />
              <div className="ns-add-list">
                {patients
                  .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(addSearch.toLowerCase()))
                  .slice(0, 8)
                  .map(p => (
                    <button key={p.uid || p.id} className="ns-add-item" onClick={() => startConversation(p)}>
                      {p.firstName} {p.lastName}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="ns-patient-list">
            {visibleConversations.map(c => {
              const name = messagingService.getConversationDisplayName(c, currentUserId)
              const unread = messagingService.getUnreadCount(c, currentUserId)
              return (
                <div key={c.id}
                  className={`ns-patient-item${selectedConversation?.id === c.id ? ' active' : ''}`}
                  onClick={() => setSelectedConversation(c)}>
                  <div className="ns-patient-av-wrap">
                    <div className="ns-patient-av" style={{ background: '#1F4788' }}>
                      <span className="ns-av-initials">{getInitials(...name.split(' '))}</span>
                    </div>
                    {unread > 0 && <span className="no-msg-unread-badge">{unread}</span>}
                  </div>
                  <div className="ns-patient-info">
                    <span className="ns-patient-name">{name}</span>
                    <span className="ns-patient-meta">{c.lastMessage || 'No messages yet'}</span>
                  </div>
                  <button className="ns-patient-remove" onClick={() => setSelectedConversation(c)} aria-label="Open">
                    <img src={sendImg} className="ns-icon" alt="" />
                  </button>
                  <button className="ns-patient-remove" onClick={e => hideConversation(c.id, e)} aria-label="Hide">
                    <img src={close} className="ns-icon" alt="" />
                  </button>
                </div>
              )
            })}

            {visibleConversations.length === 0 && (
              <p className="ns-loading-label">No conversations yet. Use + to start one.</p>
            )}
          </div>

          <div className="ns-patient-count-wrap">
            <p className="ns-patient-count">{visibleConversations.length} patients</p>
          </div>
        </div>

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
            <button className="ns-icon-btn" onClick={() => navigate('/staff/settings')} aria-label="Settings">
              <img src={settings} className="ns-alt-icon" alt="" />
            </button>
            <button className="ns-icon-btn" onClick={handleLogout} aria-label="Log out">
              <img src={logout} className="ns-other-icon" alt="" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Chat thread ───────────────────────────────────── */}
      <div className="no-msg-main">
        {!selectedConversation ? (
          <div className="no-msg-empty">
            <p className="no-msg-empty-text">Select a conversation to start messaging.</p>
          </div>
        ) : (
          <>
            <div className="no-msg-header">
              <div className="no-msg-header-patient">
                <div className="no-msg-header-av">{getInitials(...otherName.split(' '))}</div>
                <div>
                  <p className="no-msg-header-name">{otherName}</p>
                  <p className="no-msg-header-sub">
                    {messages.length > 0
                      ? `Last seen ${formatTime(messages[messages.length - 1]?.timestamp)}`
                      : 'No messages yet'}
                  </p>
                </div>
              </div>
              <div className="no-msg-header-actions">
                <button className="no-msg-icon-btn" aria-label="Search">{ICONS.search}</button>
                <button className="no-msg-icon-btn" aria-label="More">{ICONS.dots}</button>
              </div>
            </div>

            <div className="no-msg-thread">
              {messageGroups.map(g => g.type === 'divider' ? (
                <div key={g.key} className="no-msg-divider"><span>{g.label}</span></div>
              ) : (
                <div key={g.key} className={`no-msg-row${g.data.senderId === currentUserId ? ' me' : ''}`}>
                  <div className="no-msg-bubble">
                    <div className="no-msg-bubble-head">
                      <span className="no-msg-bubble-name">
                        {g.data.senderId === currentUserId ? 'You' : g.data.senderName}
                      </span>
                      <span className="no-msg-bubble-time">{formatTime(g.data.timestamp)}</span>
                    </div>
                    <p className="no-msg-bubble-text">{g.data.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="no-msg-input-row">
              <input className="no-msg-input" placeholder="Send a message"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }} />
              <button className="no-msg-send-btn" onClick={handleSend} aria-label="Send">
                <img src={sendImg} className="no-msg-send-icon" alt="" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── 3. Patient quick-info panel ──────────────────────── */}
      {selectedConversation && (
        <div className="no-msg-info">
          <div className="no-msg-info-avatar-wrap">
            {otherPatientRecord?.profilePictureUrl ? (
              <img src={otherPatientRecord.profilePictureUrl} className="no-msg-info-avatar" alt="" />
            ) : (
              <div className="no-msg-info-avatar no-msg-info-avatar--initials">
                {getInitials(...otherName.split(' '))}
              </div>
            )}
            <span className="no-msg-info-online-dot" />
          </div>

          <h2 className="no-msg-info-name">{otherName}</h2>
          <p className="no-msg-info-role">Patient</p>

          <div className="no-msg-info-quicklinks">
            <button onClick={() => navigate('/staff/notes')} aria-label="Notes">{ICONS.note}</button>
            <button onClick={() => navigate('/staff/documents')} aria-label="Documents">{ICONS.folder}</button>
            <button onClick={() => navigate('/staff/labs')} aria-label="Labs">{ICONS.flask}</button>
            <button onClick={() => navigate('/staff/imaging')} aria-label="Imaging">{ICONS.brain}</button>
          </div>

          <div className="no-msg-info-toggle">
            <span className={infoTab === 'history' ? 'active' : ''} onClick={() => setInfoTab('history')}>Medical History</span>
            <span className={infoTab === 'medication' ? 'active' : ''} onClick={() => setInfoTab('medication')}>Medication</span>
          </div>

          <div className="no-msg-info-content">
            {infoTab === 'history' ? (
              latestConsultation ? (
                <p>
                  <strong>{latestConsultation.diagnosisName || 'Undiagnosed'}</strong>
                  {latestConsultation.diagnosisType ? ` (${latestConsultation.diagnosisType})` : ''}
                  {latestConsultation.painLevel ? ` — Pain ${latestConsultation.painLevel}/10` : ''}
                  {latestConsultation.symptoms?.length > 0 ? `. Symptoms: ${latestConsultation.symptoms.join(', ')}.` : ''}
                </p>
              ) : (
                <p>No medical history on file.</p>
              )
            ) : (
              medications.length > 0 ? (
                medications.map((m, i) => (
                  <p key={i}>{m.name}{m.dosage ? ` — ${m.dosage}` : ''}{m.frequency ? `, ${m.frequency}` : ''}</p>
                ))
              ) : (
                <p>No medications on file.</p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}