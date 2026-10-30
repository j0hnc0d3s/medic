// ─────────────────────────────────────────────────────────
// FILE : src/pages/staff/NurseAvailability.jsx
// CSS  : src/pages/staff/NurseAvailability.css
//
// Doctor/nurse-settable weekly working hours + blocked (vacation/
// unavailable) dates, backed by availabilityService. A doctor edits
// only their own schedule; nurse/admin/triage get a doctor picker so
// the roster can be kept up to date on someone's behalf. This is
// what appointmentService.checkConflicts() reads before letting a
// booking through -- see NurseAppointments.jsx and
// reception/StaffAppointments.jsx, both of which now call it.
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../contexts/AuthContext'
import availabilityService, { WEEKDAYS, DEFAULT_WEEKLY_HOURS } from '../../services/availabilityService'
import NurseSidebar from './NurseSidebar'
import './NurseAvailability.css'

const DAY_LABELS = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' }

export default function NurseAvailability() {
  const { userProfile } = useAuth()
  const isDoctor = userProfile?.role === 'doctor'
  const ownName = isDoctor ? `Dr. ${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() : null

  const [doctorsList, setDoctorsList] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(ownName || '')
  const [weeklyHours, setWeeklyHours] = useState(DEFAULT_WEEKLY_HOURS)
  const [blockedDates, setBlockedDates] = useState([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [configured, setConfigured] = useState(false)

  // Doctor roster for the picker -- nurse/admin/triage manage any
  // doctor's schedule; a doctor only ever edits their own.
  useEffect(() => {
    if (isDoctor) return
    getDocs(query(collection(db, 'users'), where('role', '==', 'doctor')))
      .then(snap => {
        const names = snap.docs.map(d => {
          const { firstName, lastName } = d.data()
          return `Dr. ${firstName} ${lastName}`
        })
        setDoctorsList(names)
        if (names.length > 0 && !selectedDoctor) setSelectedDoctor(names[0])
      })
      .catch(() => setDoctorsList([]))
  }, [isDoctor])

  const activeDoctor = isDoctor ? ownName : selectedDoctor

  useEffect(() => {
    if (!activeDoctor) { setLoading(false); return }
    setLoading(true)
    availabilityService.getAvailability(activeDoctor).then(res => {
      setWeeklyHours(res.weeklyHours || DEFAULT_WEEKLY_HOURS)
      setBlockedDates(res.blockedDates)
      setConfigured(res.configured)
      setLoading(false)
      setSaved(false)
    })
  }, [activeDoctor])

  const toggleDay = (day) => {
    setWeeklyHours(h => ({ ...h, [day]: { ...h[day], enabled: !h[day].enabled } }))
    setSaved(false)
  }

  const setDayTime = (day, field, value) => {
    setWeeklyHours(h => ({ ...h, [day]: { ...h[day], [field]: value } }))
    setSaved(false)
  }

  const addBlockedDate = () => {
    if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return
    setBlockedDates(d => [...d, newBlockedDate].sort())
    setNewBlockedDate('')
    setSaved(false)
  }

  const removeBlockedDate = (date) => {
    setBlockedDates(d => d.filter(x => x !== date))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!activeDoctor) return
    setSaving(true)
    try {
      const staffName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Staff'
      const res = await availabilityService.setAvailability(activeDoctor, { weeklyHours, blockedDates }, staffName)
      if (!res.success) throw new Error(res.error)
      setConfigured(true)
      setSaved(true)
    } catch (err) {
      console.error('Failed to save availability:', err)
      alert('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="no-shell">
      <NurseSidebar />

      <div className="no-main">
        <h1 className="av-title">Availability</h1>

        {!isDoctor && (
          <div className="av-doctor-picker">
            <label>Doctor</label>
            <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
              {doctorsList.length === 0 && <option value="">No doctors on file</option>}
              {doctorsList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        {!activeDoctor ? (
          <p className="av-empty">Select a doctor to manage their availability.</p>
        ) : loading || !weeklyHours ? (
          <p className="av-empty">Loading…</p>
        ) : (
          <div className="av-grid">
            <div className="av-card">
              <h2 className="av-card-title">Weekly hours</h2>
              {!configured && (
                <p className="av-note">
                  No schedule set yet for {activeDoctor} -- treated as available every day until you save one.
                </p>
              )}
              <div className="av-week">
                {WEEKDAYS.map(day => (
                  <div key={day} className="av-day-row">
                    <label className="av-day-toggle">
                      <input type="checkbox" checked={weeklyHours[day].enabled} onChange={() => toggleDay(day)} />
                      {DAY_LABELS[day]}
                    </label>
                    {weeklyHours[day].enabled ? (
                      <div className="av-day-times">
                        <input type="time" value={weeklyHours[day].start} onChange={e => setDayTime(day, 'start', e.target.value)} />
                        <span>to</span>
                        <input type="time" value={weeklyHours[day].end} onChange={e => setDayTime(day, 'end', e.target.value)} />
                      </div>
                    ) : (
                      <span className="av-day-off">Day off</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="av-card">
              <h2 className="av-card-title">Blocked dates</h2>
              <p className="av-card-sub">Vacation, conferences, anything that overrides a normal working day.</p>
              <div className="av-add-date">
                <input type="date" value={newBlockedDate} onChange={e => setNewBlockedDate(e.target.value)} />
                <button className="av-btn av-btn--secondary" onClick={addBlockedDate}>Add</button>
              </div>
              <div className="av-date-list">
                {blockedDates.length === 0 && <p className="av-empty-sm">No blocked dates.</p>}
                {blockedDates.map(date => (
                  <span key={date} className="av-date-chip">
                    {date}
                    <button onClick={() => removeBlockedDate(date)} aria-label={`Remove ${date}`}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="av-footer">
              <button className="av-btn av-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
