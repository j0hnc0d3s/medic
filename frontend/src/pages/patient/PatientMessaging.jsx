// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseMessaging.jsx
// CSS  : src/pages/staff/NurseMessaging.css
// ─────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import PatientSidebar from './PatientSidebar'
import Profile from '../../components/Profile'
import './PatientMessaging.css'

import close from '../../assets/inverted/close.png';
import left from '../../assets/inverted/left.png';
import right from '../../assets/inverted/right.png';
import edit from '../../assets/inverted/edit.png';
import notification from '../../assets/black/notification.png';

import navleft from '../../assets/inverted/navleft.png';
import navright from '../../assets/inverted/navright.png';

import doctor from '../../assets/images/doctor1.jpeg';
import pills from '../../assets/images/pills.png';
import pollen from '../../assets/images/pollen.png';

import add from '../../assets/black/plus.png';
import notes from '../../assets/black/notes.png';
import move from '../../assets/black/move.png';
import lightning from '../../assets/black/lightning.png';
import pencil from '../../assets/black/pencil.png';
import line from '../../assets/black/line.png';

import reverse_triangle from '../../assets/images/reverse_triangle.png';
import triangle from '../../assets/images/triangle.png';

import scan1 from '../../assets/images/scan1.jpeg';
import scan2 from '../../assets/images/scan2.jpeg';
import scan3 from '../../assets/images/scan3.jpeg';
import scan4 from '../../assets/images/scan4.jpeg';
import image1 from '../../assets/images/image1.jpeg'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const ICONS = {
  plus:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  note:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  move:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>,
  pencil:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  visit: <span style={{ fontSize: 13 }}>📝</span>,
  bell:  <span style={{ fontSize: 15 }}>🔔</span>,
  flask: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  procedure: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M5 9l-3 3 3 3M19 9l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  hospitalisation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 11h6M12 8v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  menu: <svg width="4" height="16" viewBox="0 0 4 16" fill="none"><circle cx="2" cy="2" r="2" fill="currentColor"/><circle cx="2" cy="8" r="2" fill="currentColor"/><circle cx="2" cy="14" r="2" fill="currentColor"/></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const rightMid = (k) => ({ x: CARD_POS[k].left + CARD_POS[k].width, y: CARD_POS[k].top + CARD_POS[k].height / 2 })
const leftMid  = (k) => ({ x: CARD_POS[k].left, y: CARD_POS[k].top + CARD_POS[k].height / 2 })

const MOCK_TIMELINE = {
  2020: { 5: ['visit'], 8: ['visit', 'lab'] },
  2021: { 1: ['procedure'], 5: ['visit'] },
  2026: { 5: ['visit', 'lab'] },
}

const MOCK_TASKS = {
  18: [
    { id: 1, label: 'Follow up with Martha' },
    { id: 2, label: 'Follow up with Barry' },
  ],
}

const MOCK_AGENDA = {
  18: [
    { id: 1, time: '9:00 AM', label: 'H. Evans — General Consultation' },
    { id: 2, time: '11:30 AM', label: 'M. Vincent — Follow-up' },
  ],
}


const ACTIVITY_COLORS = { visit: '#0066ff', lab: '#161c18', procedure: '#0b51f5', hospitalisation: '#152fdb' }
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Draggable wrapper hook ──────────────────────────────────
function useDraggable(initial) {
  const [pos, setPos] = useState(initial)
  const dragRef = useRef(null)

  const onPointerDown = (e) => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const origin = { ...pos }

    const onMove = (ev) => {
      setPos({
        left: origin.left + (ev.clientX - startX),
        top:  origin.top  + (ev.clientY - startY),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return [pos, onPointerDown]
}

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const isToday = date.toDateString() === new Date().toDateString()
  if (isToday) return 'Today'
  const d = date.getDate()
  const suffix = (d % 10 === 1 && d !== 11) ? 'st' : (d % 10 === 2 && d !== 12) ? 'nd' : (d % 10 === 3 && d !== 13) ? 'rd' : 'th'
  return `${MONTHS[date.getMonth()]} ${d}${suffix}`
}

function groupMessagesByDate(messages) {
  const groups = []
  let lastDate = null
  messages.forEach(msg => {
    if (msg.date !== lastDate) {
      lastDate = msg.date
      groups.push({ dateLabel: formatDateLabel(msg.date), messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  })
  return groups
}

const MOCK_CONVERSATIONS = {
  p1: [
    { id: 1, sender: 'patient', text: 'Hey Doc! Can you meet for an appointment today?', time: '9:05 pm', date: '2026-06-06' },
    { id: 2, sender: 'me', text: 'My schedule a bit busy today Evans, but we could try for Wednesday at 9 AM', time: '9:05 pm', date: '2026-06-06' },
    { id: 3, sender: 'patient', text: "That works for me. I'll pencil in the details.", time: '9:05 pm', date: '2026-06-06' },
    { id: 4, sender: 'me', text: 'Sounds good! See you then.', time: '9:06 pm', date: '2026-06-06' },
    { id: 5, sender: 'me', text: 'Evans, ready for today?', time: '8:30 am', date: '2026-06-24' },
    { id: 6, sender: 'patient', text: 'Hey Doc! I wanted to discuss my options for surgery, and schedule it with you.', time: '9:05 pm', date: '2026-06-24' },
  ],
}

const DEFAULT_PATIENT = { id: 'p1', firstName: 'Harry', lastName: 'Evans', image: image1, lastSeen: 'June 15th, 2025 at 9:05 PM' }

const CURRENT_USER = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  role: 'Registered Nurse',
  image: doctor,
  online: true,
  notifications: true,
}

export default function NurseMessaging() {
  const [leftFilters, setLeftFilters] = useState({
    visits: true, hospitalisations: false, procedure: false, labs: false,
  })
  const [cardVisible, setCardVisible] = useState({ allergies: true, medication: true })

  const [allergyPage, setAllergyPage]   = useState(0)
  const [medicationPage, setMedicationPage] = useState(0)

  const [allergyPos, allergyDrag]     = useDraggable({ left: 60, top: 360 })
  const [medicationPos, medicationDrag] = useDraggable({ left: 610, top: 230 })

  const canvasRef = useRef(null)
  const timelineRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1100, height: 680 })
  const [isTimelineSpinning, setIsTimelineSpinning] = useState(false)

  const [selectedPatient, setSelectedPatient] = useState(DEFAULT_PATIENT)
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [draft, setDraft] = useState('')
  const messagesRef = useRef(null)

  const activeMessages = conversations[selectedPatient?.id] || []
  const messageGroups = groupMessagesByDate(activeMessages)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [activeMessages.length, selectedPatient])

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim() || !selectedPatient) return
    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase(),
      date: new Date().toISOString().slice(0, 10),
    }
    setConversations(c => ({ ...c, [selectedPatient.id]: [...(c[selectedPatient.id] || []), newMsg] }))
    setDraft('')
  }

  useEffect(() => {
    if (!canvasRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [])

  const onTimelinePointerDown = (e) => {
    e.preventDefault()
    const startX = e.clientX

    const onMove = (ev) => {
      // Could add visual feedback during drag here if desired
    }
    const onUp = (ev) => {
      const endX = ev.clientX
      const distance = startX - endX // positive = dragged left, negative = dragged right
      const threshold = 50

      if (Math.abs(distance) > threshold) {
        setIsTimelineSpinning(true)
        
        if (distance > 0) {
          // Dragged left - go to next year (with wraparound)
          setTimelineYear(y => y === YEARS[YEARS.length - 1] ? YEARS[0] : y + 1)
        } else {
          // Dragged right - go to previous year (with wraparound)
          setTimelineYear(y => y === YEARS[0] ? YEARS[YEARS.length - 1] : y - 1)
        }

        // Remove spinning class after animation completes
        setTimeout(() => setIsTimelineSpinning(false), 600)
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const [timelineYear, setTimelineYear] = useState(2026)

  const toggleLeftFilter = (key) => {
    if (key === 'visits') return // locked on, per spec
    setLeftFilters(f => ({ ...f, [key]: !f[key] }))
  }

  const toggleCard = (key) => setCardVisible(c => ({ ...c, [key]: !c[key] }))

  // ── Calendar grid calc ───────────────────────────────────
  const dayTasks  = MOCK_TASKS[18]  || []
  const dayAgenda = MOCK_AGENDA[18] || []

  return (
    <div className="no-shell">
      <PatientSidebar onSelectPatient={setSelectedPatient} />

      <div className="no-main">
        <div className="no-chat">
          <div className="no-chat-header">
            <div className="no-chat-header-left">
              <img src={selectedPatient?.image} className="no-chat-av" alt="" />
              <div>
                <p className="no-chat-name">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                <p className="no-chat-lastseen">Last seen {selectedPatient?.lastSeen}</p>
              </div>
            </div>

            <div className="no-chat-header-actions">
              <button className="no-chat-action-btn" aria-label="Search">{ICONS.search}</button>
              <button className="no-chat-action-btn" aria-label="More options">{ICONS.menu}</button>
            </div>
          </div>

          <div className="no-chat-messages" ref={messagesRef}>
            <div className="no-chat-watermark">
              <span className="no-chat-watermark-plus">+</span> Medic
              <span className="no-chat-watermark-tag">Care without the wait</span>
            </div>

            {messageGroups.map((group, gi) => (
              <div key={gi} className="no-chat-date-group">
                <div className="no-chat-date-divider"><span>{group.dateLabel}</span></div>

                {group.messages.map(msg => (
                  <div key={msg.id} className={`no-chat-bubble-row${msg.sender === 'me' ? ' mine' : ''}`}>
                    <img src={msg.sender === 'me' ? doctor : selectedPatient?.image} className="no-chat-bubble-av" alt="" />
                    <div className="no-chat-bubble">
                      <div className="no-chat-bubble-head">
                        <span className="no-chat-bubble-sender">
                          {msg.sender === 'me' ? 'You' : `${selectedPatient?.firstName} ${selectedPatient?.lastName}`}
                        </span>
                        <span className="no-chat-bubble-time">{msg.time}</span>
                      </div>
                      <p className="no-chat-bubble-text">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <form className="no-chat-input-row" onSubmit={handleSend}>
            <input
              className="no-chat-input"
              placeholder="Send a message"
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
            <button type="submit" className="no-chat-send-btn" aria-label="Send">{ICONS.send}</button>
          </form>
        </div>
      </div>

      {/* ── Right: calendar / agenda panel ────────────── */}
      <Profile 
        currentUser={CURRENT_USER}
        dayTasks={dayTasks}
        dayAgenda={dayAgenda}
      />
    </div>
  )
}