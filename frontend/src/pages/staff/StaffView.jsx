// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/StaffView.jsx
// CSS  : src/pages/styles/StaffView.css
// ─────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  reportService, appointmentService, patientService,
  staffService, notificationService,
} from '../../services'
import '../styles/StaffView.css'

import homeImg  from '../../assets/images/home.png'
import phoneImg from '../../assets/images/phone.png'
import clockImg from '../../assets/images/clock.png'
import schedImg from '../../assets/images/schedule.png'
import patImg from '../../assets/images/patient.png'

// ── Sidebar nav ───────────────────────────────────────────
const STAFF_NAV = [
  { img: homeImg,  path: '/staff/overview',     title: 'StaffHome',         active: true  },
  { img: phoneImg, path: '/staff/messaging',    title: 'StaffMessaging',    active: false },
  { img: clockImg, path: '/staff/appointments', title: 'StaffAppointments', active: false },
  { img: schedImg, path: '/staff/calendar',     title: 'StaffCalendar',     active: false },
  { img: patImg, path: '/staff/patients',     title: 'StaffPatients',     active: false },
]

// ── Helpers ───────────────────────────────────────────────
const mkInit = name =>
  (name || '').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

const fmtCurrency = n =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const statusCls = s =>
  ({ scheduled:'pending', confirmed:'pending', 'in-progress':'active', completed:'done' })[s] || 'pending'

const statusLabel = s =>
  (s || '').split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

const shiftLabel = s =>
  ({ day:'Day', evening:'Evening', night:'Night' })[s] || 'Active'

const AV_COLORS = ['#2D9C9C','#567C8D','#1F4788','#2F4156','#858a8e']

const getUpcomingBirthdays = patients => {
  const today = new Date(); today.setHours(0,0,0,0)
  return patients
    .filter(p => p.dateOfBirth)
    .map(p => {
      const dob  = p.dateOfBirth.toDate ? p.dateOfBirth.toDate() : new Date(p.dateOfBirth)
      let next   = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
      if (next < today) next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate())
      const days = Math.ceil((next - today) / 86400000)
      return {
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        days,
        label: days === 0 ? 'Today' : days === 1 ? 'Tomorrow'
          : next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }
    })
    .filter(x => x.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5)
}

// ── Component ─────────────────────────────────────────────
export default function StaffView() {
  const { userProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    todayAppointments: [], upcomingBirthdays: [],
    staffOnDuty: [], recentAlerts: [],
    stats: { totalPatients: 0, appointmentsToday: 0, monthlyIncome: 0, activeStaff: 0 },
  })

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      const [summary, todayAppts, patientsRes, staffRes, alertsRes] = await Promise.all([
        reportService.getDashboardSummary(),
        appointmentService.getTodayAppointments(),
        patientService.getPatients({ limit: 100 }),
        staffService.getAllStaff({ status: 'active' }),
        notificationService.getNotifications({ type: 'alert', read: false, limit: 5 }),
      ])
      if (summary.success) {
        setData({
          todayAppointments: todayAppts.success ? todayAppts.appointments : [],
          upcomingBirthdays: getUpcomingBirthdays(patientsRes.success ? patientsRes.patients : []),
          staffOnDuty      : staffRes.success ? staffRes.staff.slice(0, 5) : [],
          recentAlerts     : alertsRes.success ? alertsRes.notifications : [],
          stats: {
            totalPatients    : summary.summary.patients?.total          || 0,
            appointmentsToday: summary.summary.appointments?.today      || 0,
            monthlyIncome    : summary.summary.finances?.totalIncome    || 0,
            activeStaff      : summary.summary.staff?.active            || 0,
          },
        })
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (authLoading || loading) return (
    <div className="sv-shell">
      <div className="pv-aside-staff">
        {[
          { img: homeImg,  path: '/staff/overview',     title: 'StaffHome',         active: true  },
          { img: phoneImg, path: '/staff/messaging',    title: 'StaffMessaging',    active: false },
          { img: clockImg, path: '/staff/appointments', title: 'StaffAppointments', active: false },
          { img: schedImg, path: '/staff/calendar',     title: 'StaffCalendar',     active: false },
          { img: patImg, path: '/staff/patients',     title: 'StaffPatients',     active: false },
        ].map(({ img, path, title, active }) => (
          <button key={title} title={title} aria-label={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}>
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </div>
      <div className="sv-loading-inner"><div className="sv-spinner" /></div>
    </div>
  )

  const firstName = userProfile?.firstName || 'Staff'

  return (
    <div className="sv-shell">

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="pv-aside">
        {STAFF_NAV.map(({ img, path, title, active }) => (
          <button key={title} title={title} aria-label={title}
            className={`pv-aside-btn${active ? ' active' : ''}`}
            onClick={() => navigate(path)}>
            <img src={img} alt={title} className="pv-aside-icon" />
          </button>
        ))}
      </aside>

      {/* ── Page ────────────────────────────────── */}
      <div className="sv-page">

        {/* ── Header ──────────────────────────── */}
        <div className="sv-header">
          <div>
            <h1 className="sv-greeting">Welcome back, {firstName}!</h1>
            <p className="sv-sub">Here's what's happening at the clinic today</p>
          </div>
          <button className="sv-add-btn" onClick={() => navigate('/staff/addpatient')}>
            + Add Patient
          </button>
        </div>

        {/* ── Stat cards ──────────────────────── */}
        <div className="sv-stats">
          <div className="sv-stat-card sv-stat-card--dark">
            <p className="sv-stat-value">{data.stats.totalPatients}</p>
            <p className="sv-stat-label">Total Patients</p>
          </div>
          <div className="sv-stat-card">
            <p className="sv-stat-value">{data.stats.appointmentsToday}</p>
            <p className="sv-stat-label">Appointments Today</p>
          </div>
          <div className="sv-stat-card sv-stat-card--dark">
            <p className="sv-stat-value">{fmtCurrency(data.stats.monthlyIncome)}</p>
            <p className="sv-stat-label">Monthly Income</p>
          </div>
          <div className="sv-stat-card">
            <p className="sv-stat-value">{data.stats.activeStaff}</p>
            <p className="sv-stat-label">Active Staff</p>
          </div>
        </div>

        {/* ── 2-col grid ──────────────────────── */}
        <div className="sv-grid">

          {/* LEFT */}
          <div className="sv-col">

            {/* Today's Appointments */}
            <div className="sv-card">
              <div className="sv-card-head">
                <h2 className="sv-card-title">Today's Appointments</h2>
                <span className="sv-badge">{data.todayAppointments.length}</span>
              </div>

              {data.todayAppointments.length > 0 ? (
                <div className="sv-list">
                  {data.todayAppointments.slice(0, 4).map((a, i) => (
                    <div key={a.id} className="sv-list-item">
                      <div className="sv-av" style={{ background: AV_COLORS[i % AV_COLORS.length] }}>
                        {mkInit(a.patientName)}
                      </div>
                      <div className="sv-item-info">
                        <p className="sv-item-name">{a.patientName}</p>
                        <p className="sv-item-meta">
                          {a.appointmentTime && <span>{a.appointmentTime}</span>}
                          {a.type && <span> · {a.type}</span>}
                        </p>
                      </div>
                      <span className={`sv-status sv-status--${statusCls(a.status)}`}>
                        {statusLabel(a.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sv-empty">
                  <p className="sv-empty-text">No appointments today</p>
                </div>
              )}

              <button className="sv-card-link" onClick={() => navigate('/staff/appointments')}>
                View all appointments →
              </button>
            </div>

            {/* Staff On Duty */}
            <div className="sv-card">
              <div className="sv-card-head">
                <h2 className="sv-card-title">Staff On Duty</h2>
                <span className="sv-badge">{data.staffOnDuty.length}</span>
              </div>

              {data.staffOnDuty.length > 0 ? (
                <div className="sv-list">
                  {data.staffOnDuty.map((s, i) => {
                    const name  = s.fullName || `${s.firstName} ${s.lastName}`
                    const isOff = s.status === 'off-duty' || s.status === 'on-leave'
                    return (
                      <div key={s.id} className="sv-list-item">
                        <div className="sv-av" style={{ background: AV_COLORS[i % AV_COLORS.length] }}>
                          {mkInit(name)}
                        </div>
                        <div className="sv-item-info">
                          <p className="sv-item-name">
                            {s.role === 'Doctor' ? 'Dr. ' : ''}{name}
                          </p>
                          <p className="sv-item-meta">
                            {s.department || s.specialization || s.role}
                            {s.shift ? ` · ${shiftLabel(s.shift)} shift` : ''}
                          </p>
                        </div>
                        <span className={`sv-status${isOff ? ' sv-status--off' : ' sv-status--active'}`}>
                          {isOff ? (s.status === 'on-leave' ? 'On Leave' : 'Off Duty') : 'On Duty'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="sv-empty">
                  <p className="sv-empty-text">No staff on duty</p>
                </div>
              )}

              <button className="sv-card-link" onClick={() => navigate('/staff/calendar')}>
                View staff calendar →
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="sv-col">

            {/* Upcoming Birthdays */}
            <div className="sv-card">
              <div className="sv-card-head">
                <h2 className="sv-card-title">Upcoming Birthdays</h2>
                {data.upcomingBirthdays.length > 0 && (
                  <span className="sv-badge">{data.upcomingBirthdays.length}</span>
                )}
              </div>

              {data.upcomingBirthdays.length > 0 ? (
                <div className="sv-list">
                  {data.upcomingBirthdays.map(b => (
                    <div key={b.id}
                      className={`sv-list-item sv-list-item--clickable${b.days === 0 ? ' sv-list-item--today' : ''}`}
                      onClick={() => navigate(`/staff/patients/${b.id}`)}>
                      <div className="sv-birthday-icon">🎂</div>
                      <div className="sv-item-info">
                        <p className="sv-item-name">{b.name}</p>
                        <p className="sv-item-meta">{b.label}</p>
                      </div>
                      {b.days > 0 && (
                        <span className="sv-days-badge">
                          {b.days}d
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sv-empty">
                  <p className="sv-empty-text">No birthdays in the next 30 days</p>
                </div>
              )}

              <button className="sv-card-link" onClick={() => navigate('/staff/patients')}>
                View all patients →
              </button>
            </div>

            {/* System Alerts */}
            <div className="sv-card">
              <div className="sv-card-head">
                <h2 className="sv-card-title">System Alerts</h2>
                {data.recentAlerts.length > 0 && (
                  <span className="sv-badge sv-badge--alert">{data.recentAlerts.length}</span>
                )}
              </div>

              <div className="sv-list">
                {data.recentAlerts.length > 0 ? data.recentAlerts.map(a => (
                  <div key={a.id} className="sv-alert-item sv-alert-item--warn">
                    <div className="sv-alert-dot sv-alert-dot--warn" />
                    <div className="sv-item-info">
                      <p className="sv-item-name">{a.title}</p>
                      <p className="sv-item-meta">{a.message}</p>
                    </div>
                  </div>
                )) : (
                  <div className="sv-alert-item">
                    <div className="sv-alert-dot sv-alert-dot--ok" />
                    <div className="sv-item-info">
                      <p className="sv-item-name">All Clear</p>
                      <p className="sv-item-meta">No system alerts at this time</p>
                    </div>
                  </div>
                )}
              </div>

              <button className="sv-card-link" onClick={() => navigate('/staff/notifications')}>
                View all alerts →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}