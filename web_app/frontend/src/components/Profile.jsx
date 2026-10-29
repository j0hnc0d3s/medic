import { useState } from 'react'
import './Calendar.css'
import './Profile.css'
import close from '../assets/inverted/close.png'
import left from '../assets/inverted/left.png'
import right from '../assets/inverted/right.png'
import edit from '../assets/inverted/edit.png'
import notification from '../assets/black/notification.png'
import documents from '../assets/black/documents.png'
import notes from '../assets/black/notes.png'
import imaging from '../assets/black/imaging.png'
import tests from '../assets/black/tests.png'

import checked from '../assets/inverted/checked.png'
import unchecked from '../assets/inverted/unchecked.png'
import image1 from '../assets/images/image1.jpeg'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Profile({ 
  currentUser, 
  patient,
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
          <div className="no-agenda-tabs profile">
            <button className={`no-agenda-tab agenda${agendaTab === 'agenda' ? ' active' : ' inactive'}`}
              onClick={() => setAgendaTab('agenda')}>Agenda</button>
            <button className={`no-agenda-tab tasks${agendaTab === 'tasks' ? ' active' : ' inactive'}`}
              onClick={() => setAgendaTab('tasks')}>Tasks</button>
          </div>

          <div className="no-agenda-body">
            <div className="profile-body">
              <div className="no-profile-body-wrap">
                <div className="no-profile-body-icon">
                  <img
                    src={patient?.image || image1}
                    className="no-full-icon"
                    alt={patient ? `${patient.firstName} ${patient.lastName}` : ''}
                  />
                </div>
                {patient?.online && <span className="no-profile-dot" />}
              </div>

              <div className="profile-content">
                <p className="profile-content-name">{patient ? `${patient.firstName} ${patient.lastName}` : 'Select a patient'}</p>
                <p className="profile-content-role">Patient</p>
              </div>

              <div className="profile-icons">
                <div className="profile-icon">
                  <img src={notes} className="no-profile-icon"/>
                </div>

                <div className="profile-icon">
                  <img src={documents} className="no-profile-icon"/>
                </div>

                <div className="profile-icon">
                  <img src={tests} className="no-profile-icon"/>
                </div>

                <div className="profile-icon">
                  <img src={imaging} className="no-profile-icon"/>
                </div>
              </div>

              <div className="ad-profile-tabs">
                <p
                  className="ad-profile-tab"
                  onClick={() => setProfileTab('history')}
                  style={{ fontWeight: profileTab === 'history' ? 700 : 400, cursor: 'pointer' }}
                >
                  Medical History
                </p>
                <p
                  className="ad-profile-tab right"
                  onClick={() => setProfileTab('medication')}
                  style={{ fontWeight: profileTab === 'medication' ? 700 : 400, cursor: 'pointer' }}
                >
                  Medication
                </p>
              </div>

              <div>
                {profileTab === 'history' ? (
                  <p className="ad-profile-tab-content">
                    25-year-old male with a history of type 2 diabetes mellitus (diagnosed 2018), 
                    hypertension, and hyperlipidemia. Last HbA1c: 7.1% (May 2026). Blood pressure is 
                    generally controlled on current regimen, averaging 128/82 at home. <br/> <br/>
                    Prior procedures include appendectomy (2004) and left knee arthroscopy (2019). 
                    Reports intermittent low back pain, worsened by prolonged standing; no red-flag 
                    neurologic symptoms. No known drug allergies. Former smoker (quit 2016), occasional alcohol use. <br/> <br/>
                    Family history notable for coronary artery disease (father) and type 2 diabetes 
                    (mother). Most recent labs show LDL 96 mg/dL, creatinine 0.9 mg/dL, and eGFR, 60.
                  </p>
                ) : (
                  <p className="ad-profile-tab-content">
                    Metformin 1000 mg PO twice daily with meals (for type 2 diabetes). <br/> <br/>
                    Lisinopril 20 mg PO once daily (for hypertension). <br/> <br/>
                    Atorvastatin 20 mg PO nightly (for hyperlipidemia). <br/> <br/>
                    Ibuprofen 400 mg PO every 8 hours as needed for low back pain. <br/> <br/>
                    Patient reports good adherence, no missed doses this week, and no significant side effects.
                  </p>
                )}
              </div>
            </div>

            <div className="agenda-area">
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