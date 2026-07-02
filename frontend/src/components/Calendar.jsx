import { useState } from 'react'
import close from '../assets/inverted/close.png'
import left from '../assets/inverted/left.png'
import right from '../assets/inverted/right.png'
import edit from '../assets/inverted/edit.png'
import notification from '../assets/black/notification.png'
import checked from '../assets/inverted/checked.png'
import unchecked from '../assets/inverted/unchecked.png'
import './Calendar.css'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Calendar({ 
  currentUser, 
  dayTasks = [],
  dayAgenda = [],
  onTaskChecked = () => {}
}) {
  const [agendaOpen, setAgendaOpen] = useState(true)
  const [agendaTab, setAgendaTab] = useState('tasks')
  const [calMonth, setCalMonth] = useState({ year: 2026, month: 5 })
  const [selectedDay, setSelectedDay] = useState(18)
  const [checkedTasks, setCheckedTasks] = useState({})

  const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay()
  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate()
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  const toggleTaskChecked = (id) => {
    setCheckedTasks(t => ({ ...t, [id]: !t[id] }))
    onTaskChecked?.(id, !checkedTasks[id])
  }

  return (
    <>
      {agendaOpen ? (
        <div className="no-agenda">
          <div className="no-agenda-tabs">
            <button className={`no-agenda-tab agenda${agendaTab === 'agenda' ? ' active' : ' inactive'}`}
              onClick={() => setAgendaTab('agenda')}>Agenda</button>
            <button className={`no-agenda-tab tasks${agendaTab === 'tasks' ? ' active' : ' inactive'}`}
              onClick={() => setAgendaTab('tasks')}>Tasks</button>
          </div>

          <div className="no-agenda-body">
            <div className="calendar-body">
              <div className="no-agenda-head">
                <span className="no-agenda-pill">Today</span>
                <button className="no-agenda-close" onClick={() => setAgendaOpen(false)} aria-label="Collapse panel">
                  <img src={close} className="ns-icon"/>
                </button>
              </div>

              <div className="no-cal-header">
                <h2 className="no-cal-month">{MONTHS[calMonth.month].slice(0, 3)} '{String(calMonth.year).slice(2)}</h2>
                <div className="no-cal-nav">
                  <button className="no-cal-nav-wrap" onClick={() => setCalMonth(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 })}>
                    <img src={left} className="ns-icon"/>  
                  </button>

                  <button className="no-cal-nav-wrap" onClick={() => setCalMonth(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 })}>
                    <img src={right} className="ns-icon"/> 
                  </button>
                </div>
              </div>

              <div className="no-cal-grid">
                {DAY_NAMES.map(d => <span key={d} className="no-cal-dayname">{d}</span>)}
                {cells.map((d, i) => (
                  <button key={i}
                    className={`no-cal-cell${!d ? ' empty' : ''}${d === selectedDay ? ' today' : ''}`}
                    disabled={!d}
                    onClick={() => setSelectedDay(d)}>
                    {d || ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="agenda-area">
              {agendaTab === 'tasks' ? (
                <>
                  <p className="no-tasks-label">Tasks</p>
                  {dayTasks.length > 0 ? dayTasks.map(t => (
                    <div key={t.id} className="no-task-item tasks">
                      <button className="no-task-checkbox" onClick={() => toggleTaskChecked(t.id)} aria-label={checkedTasks[t.id] ? 'Uncheck task' : 'Check task'}>
                        <img src={checkedTasks[t.id] ? checked : unchecked} className="ns-icon" />
                      </button>

                      <div className="no-task-info">
                        <p className="no-task-name">{t.label}</p>
                        <p className="no-task-when">Today</p>
                      </div>
                      <button className="no-task-btn">
                        <img src={edit} className="ns-sml-icon"/> 
                      </button>

                      <button className="no-task-btn">
                        <img src={close} className="ns-sml-icon"/> 
                      </button>
                    </div>
                  )) : <p className="no-empty-hint">No tasks for this day</p>}
                </>
              ) : (
                <>
                  <p className="no-tasks-label">Agenda</p>
                  {dayAgenda.length > 0 ? dayAgenda.map(a => (
                    <div key={a.id} className="no-task-item agenda">
                      <span className="no-agenda-time">{a.time}</span>
                      <div className="no-task-info">
                        <p className="no-task-name">{a.label}</p>
                      </div>
                    </div>
                  )) : <p className="no-empty-hint">No appointments scheduled</p>}
                </>
              )}

              {currentUser && (
                <div className="no-agenda-patient">
                  <div className="no-profile-av-wrap">
                    <div className="no-profile-av">
                      <img
                        src={currentUser.image}
                        className="no-full-icon"
                        alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      />
                    </div>

                    {currentUser.online && <span className="no-online-dot" />}
                  </div>

                  <div className="ns-patient-info">
                    <span className="ns-patient-name">{currentUser.firstName} {currentUser.lastName}</span>
                    <span className="ns-patient-meta">{currentUser.role}</span>
                  </div>

                  <button className="no-agenda-bell" aria-label="Notifications">
                    <img src={notification} className="ns-icon"/> 

                    {currentUser.notifications && <span className="no-notification-dot" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button className="no-reopen-tab" onClick={() => setAgendaOpen(true)}>Calendar</button>
      )}
    </>
  )
}