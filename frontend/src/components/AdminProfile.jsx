import { useState } from 'react'
import './Calendar.css'
import './AdminProfile.css'
import close from '../assets/inverted/close.png'
import left from '../assets/inverted/left.png'
import right from '../assets/inverted/right.png'
import edit from '../assets/inverted/edit.png'
import notification from '../assets/black/notification.png'
import documents from '../assets/black/documents.png'
import notes from '../assets/black/notes.png'
import imaging from '../assets/black/imaging.png'
import tests from '../assets/black/tests.png'
import pills from '../assets/images/pills.png'

import checked from '../assets/inverted/checked.png'
import unchecked from '../assets/inverted/unchecked.png'
import image1 from '../assets/images/image1.jpeg'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const MEDICATIONS = [
  {
    id: 1,
    name: 'Metformin',
    dose: '1000 mg',
    form: 'Tablet',
    route: 'PO',
    freq: 'Twice daily with meals',
    desc: 'For type 2 diabetes.',
    doctor: 'Dr. Marcel Brown',
  },
  {
    id: 2,
    name: 'Lisinopril',
    dose: '20 mg',
    form: 'Tablet',
    route: 'PO',
    freq: 'Once daily',
    desc: 'For hypertension.',
    doctor: 'Dr. Marcel Brown',
  },
]

export default function Profile({ 
  currentUser, 
  dayTasks = [],
  dayAgenda = [],
  onTaskChecked = () => {}
}) {
  const [agendaOpen, setAgendaOpen] = useState(true)
  const [agendaTab, setAgendaTab] = useState('tasks')
  const [profileTab, setProfileTab] = useState('history')
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
        <div className="ad-no-agenda">
          <div className="ad-no-agenda-body">
            <div className="ad-profile-body">
              <div className="ad-no-profile-body-wrap">
                <div className="ad-no-profile-body-icon">
                  <img
                    src={image1}
                    className="ad-no-full-icon"
                    alt={`${currentUser.firstName} ${currentUser.lastName}`}
                  />
                </div>

                {currentUser.online && <span className="ad-no-profile-dot" />}
              </div>

              <div className="ad-profile-content">
                <p className="ad-profile-content-name">Harry Evans</p>
                <p className="ad-profile-content-role">Patient</p>
              </div>

              <div className="ad-profile-icons">
                <div className="ad-profile-icon">
                  <img src={notes} className="no-profile-icon"/>
                </div>

                <div className="ad-profile-icon">
                  <img src={documents} className="no-profile-icon"/>
                </div>

                <div className="ad-profile-icon">
                  <img src={tests} className="no-profile-icon"/>
                </div>

                <div className="ad-profile-icon">
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
                  <div className="ad-profile-tab-content">
                    <p>Patient reports good adherence, no missed doses this week, and no significant side effects.</p>

                    {MEDICATIONS.map((medication) => (
                      <div key={medication.id} className="no-med-row" style={{ marginBottom: 16 }}>
                        <div className="no-pill-bottle">
                          <img src={pills} className="no-pills-icon" alt="Medication" />
                        </div>

                        <div>
                          <p className="no-med-name" style={{ color: '#000000' }}>{medication.name}</p>

                          <div className="no-med-tags">
                            <span className="no-med-tag" style={{ color: '#FFFFFF', backgroundColor: '#0066ff', justifyContent: 'center', alignItems: 'center'  }}>{medication.dose}</span><span className="no-med-tag" style={{ color: '#FFFFFF', backgroundColor: '#0066ff', justifyContent: 'center', alignItems: 'center' }}>{medication.form}</span>
                            <span className="no-med-tag" style={{ color: '#FFFFFF', backgroundColor: '#0066ff', justifyContent: 'center', alignItems: 'center'  }}>{medication.route}</span><span className="no-med-tag" style={{ color: '#FFFFFF', backgroundColor: '#0066ff', justifyContent: 'center', alignItems: 'center'  }}>{medication.freq}</span>
                          </div>

                          <p className="no-med-desc" style={{ color: '#000000' }}>{medication.desc}</p>

                          <div className="no-med-profile">
                            <div className="no-med-profile-photo">
                              <img src={image1} className="no-med-doctor-photo" alt={medication.doctor} />
                            </div>

                            <div className="no-med-doctor-assigned" style={{ color: '#000000' }}>
                              <p className="no-med-doctor" style={{ color: '#000000' }}>Prescribed by</p>
                              <p className="no-med-doctor-name" style={{ color: '#000000' }}>{medication.doctor}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button className="ad-no-reopen-tab" onClick={() => setAgendaOpen(true)}>Calendar</button>
      )}
    </>
  )
}