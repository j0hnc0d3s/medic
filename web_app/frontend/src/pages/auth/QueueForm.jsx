// ─────────────────────────────────────────────────────────
// FILE : src/pages/auth/QueueForm.jsx
//
// Step 0  : General Info     (name, DOB, phone, email)
// Step 1  : Your condition   (reason, date picker, time)
// Step 2  : Your symptoms    (duration, slider, tags, emergency)
// Step 3  : Your documents   (ID upload, insurance upload)
// Step 4  : Your ailments    (condition, allergies, medications)
// Step 5  : Your surgeries   (surgery history)
// Step 6  : Your contacts    (emergency contact)
// Step 7  : Review           (accordion summary)
// ─────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './QueueForm.css'

import left  from '../../assets/black/left.png'
import right from '../../assets/black/right.png'
import down from '../../assets/black/down.png'

// ── Step metadata ─────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Your condition'    },
  { num: 2, label: 'Your symptoms'     },
  { num: 3, label: 'Your documents'    },
  { num: 4, label: 'Your ailments/info'},
  { num: 5, label: 'Your surgeries'    },
  { num: 6, label: 'Your contacts'     },
]

const CONDITION_OPTIONS = ['Asthma', 'Hypertension', 'Heart Disease', 'Diabetes', 'Other']
const DURATION_OPTIONS  = ['24 hours', '1 to 3 days', '3 to 7 days', 'More than a week']
const MONTH_NAMES       = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES         = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const TIME_SLOTS        = ['8–9 AM','9–11 AM','11–1 PM','1–3 PM','3–5 PM']

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'

// ── Helper sub-components ─────────────────────────────────

// Pill-style radio button
function PillRadio({ options, value, onChange, name }) {
  return (
    <div className="qf-pill-radio">
      {options.map(opt => (
        <button key={opt}
          type="button"
          className={`qf-pill-radio-btn${value === opt ? ' selected' : ''}`}
          onClick={() => onChange(opt)}>
          <span className={`qf-radio-dot${value === opt ? ' selected' : ''}`} />
          {opt}
        </button>
      ))}
    </div>
  )
}

// Tag input (type + Enter to add, click × to remove)
function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('')

  const tryAdd = (rawVal) => {
    const val = rawVal.trim()
    if (val && !tags.includes(val)) {
      onAdd(val)
    }
    setInput('')
  }

  return (
    <div className="qf-tag-input-wrap">
      <div className="qf-tag-input-row">
        <input
          className="qf-input tag"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              e.stopPropagation()
              tryAdd(e.target.value) // ← DOM value, not state closure
            }
          }}
          placeholder={placeholder}
        />

        <button
          type="button"
          className="qf-tag-add-btn"
          onClick={() => tryAdd(input)}
        >
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="qf-tags">
          {tags.map(t => (
            <span key={t} className="qf-tag">
              {t}
              <button
                type="button"
                className="qf-tag-remove"
                onClick={() => onRemove(t)}
              >×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
// ── Custom pain slider — draggable thumb + live value bubble ──
function PainSlider({ value, onChange, min = 1, max = 10 }) {
  const trackRef = useRef()
  const [dragging, setDragging] = useState(false)

  const pct = ((value - min) / (max - min)) * 100
  const severity = value <= 3 ? 'low' : value <= 6 ? 'mid' : 'high'

  const updateFromClientX = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const newVal = Math.round(min + ratio * (max - min))
    if (newVal !== value) onChange(newVal)
  }

  const handlePointerDown = e => {
    setDragging(true)
    updateFromClientX(e.clientX)
  }

  useEffect(() => {
    if (!dragging) return
    const handleMove = e => updateFromClientX(e.clientX)
    const handleUp    = () => setDragging(false)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragging])

  const handleKeyDown = e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   onChange(Math.min(max, value + 1))
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') onChange(Math.max(min, value - 1))
  }

  return (
    <div className="qf-pain-slider">
      <div
        ref={trackRef}
        className="qf-pain-track"
        onPointerDown={handlePointerDown}
      >
        <div className={`qf-pain-fill qf-pain-fill--${severity}`} style={{ width: `${pct}%` }} />

        {/* Tick marks */}
        <div className="qf-pain-ticks">
          {Array.from({ length: max - min + 1 }, (_, i) => (
            <span key={i} className="qf-pain-tick" />
          ))}
        </div>

        <div
          className={`qf-pain-thumb qf-pain-thumb--${severity}${dragging ? ' dragging' : ''}`}
          style={{ left: `${pct}%` }}
          role="slider"
          tabIndex={0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onKeyDown={handleKeyDown}
        >
          <span className="qf-pain-bubble"></span>
        </div>
      </div>

      <div className="qf-pain-labels">
        <span>Mild</span><span>Moderate</span><span>Severe</span>
      </div>
    </div>
  )
}

// File drop zone
function FileDropZone({ value, onFile }) {
  const ref   = useRef()
  const [drag, setDrag] = useState(false)

  // Derive display name from whatever is in the parent form state —
  // survives step navigation because the parent holds the File object.
  const displayName = value instanceof File ? value.name : null

  const handle = f => { onFile?.(f) }

  return (
    <div
      className={`qf-dropzone${drag ? ' drag' : ''}${displayName ? ' has-file' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true)  }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      onClick={() => ref.current.click()}>
      <input ref={ref} type="file" hidden onChange={e => handle(e.target.files[0])} />
      {displayName ? (
        <p className="qf-dropzone-name">✓ {displayName}</p>
      ) : (
        <>
          <svg className="qf-dropzone-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v12M8 8l4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="qf-dropzone-label">Drop file here</p>
        </>
      )}
    </div>
  )
}

// Inline date picker
function DatePicker({ value, onChange }) {
  const today = new Date()
  const [cal, setCal] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const firstDay   = new Date(cal.year, cal.month, 1).getDay()
  const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate()
  const cells      = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  return (
    <div className="qf-calendar">
      <div className="qf-cal-header">
        <button className="qf-cal-nav" onClick={() => setCal(c => {
          const m = c.month - 1 < 0 ? 11 : c.month - 1
          return { year: c.month - 1 < 0 ? c.year - 1 : c.year, month: m }
        })}>‹</button>
        <span className="qf-cal-month">{MONTH_NAMES[cal.month]} {cal.year}</span>
        <button className="qf-cal-nav" onClick={() => setCal(c => {
          const m = c.month + 1 > 11 ? 0 : c.month + 1
          return { year: c.month + 1 > 11 ? c.year + 1 : c.year, month: m }
        })}>›</button>
      </div>
      <div className="qf-cal-days">
        {DAY_NAMES.map(d => <div key={d} className="qf-cal-day-name">{d}</div>)}
        {cells.map((d, i) => (
          <button key={i}
            className={`qf-cal-cell${!d ? ' empty' : ''}${
              value && d === value.getDate() &&
              cal.month === value.getMonth() &&
              cal.year  === value.getFullYear() ? ' selected' : ''
            }${d === today.getDate() && cal.month === today.getMonth() &&
              cal.year === today.getFullYear() ? ' today' : ''}`}
            disabled={!d}
            onClick={() => d && onChange(new Date(cal.year, cal.month, d))}>
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  )
}

// Step indicator (shows in login-buttons area via onStepChange)
function StepIndicator({ currentStep }) {
  const stepNum = Number(currentStep)
  const start   = Math.max(1, Math.min(stepNum - 1, STEPS.length - 3))
  const visible = STEPS.slice(start - 1, start + 3)

  return (
    <div className="qf-step-indicator">
      {/* Everything else — wrapped in one shared background */}
      <div className="qf-si-rest">
        {visible.map(s => {
          const isCurrent = s.num === stepNum
          const isNext = s.num === stepNum + 1
          const isPast = s.num < stepNum

          if (isCurrent) {
            return (
              <div key={s.num} className="qf-si-pill qf-si-pill--current">
                <span className="qf-si-num">Step {String(s.num).padStart(2,'0')}</span>
                <span className="qf-si-sub">{s.label}</span>
              </div>
            )
          }

          return isNext ? (
            <div key={s.num} className="qf-si-pill qf-si-pill--next">
              <span className="qf-si-next-label">Next</span>
              <span className="qf-si-num">Step {String(s.num).padStart(2,'0')}</span>
            </div>
          ) : (
            <span key={s.num} className={`qf-si-plain${isPast ? ' past' : ''}`}>
              Step {String(s.num).padStart(2,'0')}
            </span>
          )
        })}
      </div>
    </div>
  )
}



// ══════════════════════════════════════════════════════════
//  MAIN FORM
// ══════════════════════════════════════════════════════════
export function QueueJoinForm({ onStepChange }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [form, setForm] = useState({
    // Step 0
    fullName: '', dateOfBirth: '', phone: '', email: '',
    // Step 1
    reason: '', appointmentDate: null, appointmentTime: '',
    // Step 2
    duration: '', painLevel: 3, symptoms: [], isEmergency: null,
    // Step 3
    govId: null, insurance: null,
    // Step 4
    condition: '', allergies: [], medications: [],
    // Step 5
    hadSurgery: null, surgeryDetails: '',
    // Step 6
    contactName: '', contactRelation: '', contactPhone: '',
    contactEmail: '', contactMethod: '',
  })

  const [openSection, setOpenSection] = useState('symptoms')

  useEffect(() => { onStepChange?.(step) }, [step])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addTag    = (key, val) => setForm(f => ({ ...f, [key]: [...f[key], val] }))
  const removeTag = (key, val) => setForm(f => ({ ...f, [key]: f[key].filter(t => t !== val) }))

  const goNext = () => setStep(s => s + 1)
  const goBack = () => setStep(s => Math.max(0, s - 1))

  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      data: reader.result.split(',')[1],  // base64 only, no data: prefix
    })
    reader.readAsDataURL(file)
  })

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      // Shallow-clone form so we don't mutate state
      const payload = { ...form }

      // File objects can't travel through JSON.stringify — convert to base64.
      // The backend receives { name, type, data } and can save to Firebase Storage.
      if (form.govId instanceof File)     payload.govId     = await fileToBase64(form.govId)
      if (form.insurance instanceof File) payload.insurance  = await fileToBase64(form.insurance)

      const response = await fetch(`${API_URL}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Something went wrong submitting your information.')
      navigate('/queue/confirmation', { state: { queueEntryId: data.data.queueEntryId } })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = e => set(e.target.name, e.target.value)

  return (
    <div className="qf-join">

      {/* Step indicator for steps 1-6 */}
      {step >= 1 && step <= 6 && <StepIndicator currentStep={step} />}

      {/* ── Step 0: General info ─────────────────────── */}
      {step === 0 && (
        <div className="qf-step-body">
          <div className="qf-field">
            <label className="qf-label">What your name?</label>
            <input className="qf-input" type="text" name="fullName"
              placeholder="e.g: John Doe." value={form.fullName} onChange={handleChange} />
          </div>

          <div className="qf-field">
            <div className="qf-label-row">
              <label className="qf-label">What your date of birth?</label>
              <span className="qf-label-hint">MM/DD/YYYY.</span>
            </div>
            <input className="qf-input" type="date" name="dateOfBirth"
              value={form.dateOfBirth} onChange={handleChange} />
          </div>

          <div className="qf-field-row">
            <div className="qf-field">
              <label className="qf-label">What your phone number?</label>
              <input className="qf-input" type="tel" name="phone"
                placeholder="1 (###) ###-####" value={form.phone} onChange={handleChange} />
            </div>
            <div className="qf-field">
              <label className="qf-label">What your email?</label>
              <input className="qf-input" type="email" name="email"
                placeholder="e.g: johndoe@gmail.com" value={form.email} onChange={handleChange} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Your condition ────────────────────── */}
      {step === 1 && (
        <div className="qf-step-body">
          <div className="qf-field">
            <label className="qf-label">What brings you in today?</label>
            <input className="qf-input" type="text" name="reason"
              placeholder="e.g: Chest pain, fever, follow-up appointment, lab results etc."
              value={form.reason} onChange={handleChange} />
          </div>

          <div className="qf-field">
            <label className="qf-label">Date</label>
            <DatePicker
              value={form.appointmentDate}
              onChange={d => set('appointmentDate', d)} />
          </div>

          <div className="qf-field">
            <label className="qf-label">Time</label>
            <div className="qf-chip-row">
              {TIME_SLOTS.map(t => (
                <button key={t} type="button"
                  className={`qf-chip${form.appointmentTime === t ? ' selected' : ''}`}
                  onClick={() => set('appointmentTime', t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Your symptoms ─────────────────────── */}
      {step === 2 && (
        <div className="qf-step-body">
          <div className="qf-field">
            <label className="qf-label">How long have you had these symptoms?</label>
            <PillRadio
              options={DURATION_OPTIONS}
              value={form.duration}
              onChange={v => set('duration', v)} />
          </div>

          <div className="qf-field">
            <label className="qf-label">On a scale of 1–10, how would you rate your pain?</label>
            <PainSlider
              value={form.painLevel}
              onChange={v => set('painLevel', v)} />
          </div>

          <div className="qf-field">
            <label className="qf-label">What symptoms do you have</label>

            <TagInput
              tags={form.symptoms}
              onAdd={v => addTag('symptoms', v)}
              onRemove={v => removeTag('symptoms', v)}
              placeholder="e.g: Fever, Shortness of Breath, Chest pain etc." />
          </div>

          <div className="qf-field">
            <label className="qf-label">
              Is this an emergency?{' '}
              <span className="qf-disclaimer">
                If after evaluation a false yes is found to be given you'll be placed in
                the regular queue increasing wait time. Also consider that falsifying
                responses affects critical ill patients, as well as yourself.
              </span>
            </label>
            <PillRadio
              options={['Yes', 'No']}
              value={form.isEmergency}
              onChange={v => set('isEmergency', v)} />
          </div>
        </div>
      )}

      {/* ── Step 3: Your documents ────────────────────── */}
      {step === 3 && (
        <div className="qf-step-body">
          <div className="qf-field">
            <label className="qf-label">
              Please provide your government identification.{' '}
              <span className="qf-label-eg">e.g: TRN, Driver's License, and Passport</span>
            </label>
            <FileDropZone value={form.govId} onFile={f => set('govId', f)} />
          </div>

          <div className="qf-field">
            <label className="qf-label">
              If applicable, please provide your insurance details.{' '}
              <span className="qf-label-eg">e.g: front, and back of card.</span>
            </label>
            <FileDropZone value={form.insurance}   onFile={f => set('insurance', f)} />
          </div>
        </div>
      )}

      {/* ── Step 4: Your ailments/info ────────────────── */}
      {step === 4 && (
        <div className="qf-step-body">
          <div className="qf-field">
            <label className="qf-label">Do you have any of these conditions?</label>
            <PillRadio
              options={CONDITION_OPTIONS}
              value={form.condition}
              onChange={v => set('condition', v)} />
          </div>

          <div className="qf-field">
            <label className="qf-label">Do you have any allergies?</label>
            <TagInput
              tags={form.allergies}
              onAdd={v => addTag('allergies', v)}
              onRemove={v => removeTag('allergies', v)}
              placeholder="e.g: Nuts, Pollen, etc." />
          </div>

          <div className="qf-field">
            <label className="qf-label">Are you on any medications</label>
            <TagInput
              tags={form.medications}
              onAdd={v => addTag('medications', v)}
              onRemove={v => removeTag('medications', v)}
              placeholder="e.g: Atorvastatin etc." />
          </div>
        </div>
      )}

      {/* ── Step 5: Your surgeries ────────────────────── */}
      {step === 5 && (
        <div className="qf-step-body">
          <div className="qf-field">
            <label className="qf-label">
              Have you had any previous surgery?{' '}
              <span className="qf-disclaimer">
                If after evaluation a false yes is found to be given you'll be placed in
                the regular queue increasing wait time. Also consider that falsifying
                responses affects critical ill patients, as well as yourself.
              </span>
            </label>
            <PillRadio
              options={['Yes', 'No']}
              value={form.hadSurgery}
              onChange={v => set('hadSurgery', v)} />
          </div>

          {form.hadSurgery === 'Yes' && (
            <div className="qf-field">
              <label className="qf-label">If yes, please explain.</label>
              <textarea className="qf-input qf-textarea" name="surgeryDetails"
                placeholder="e.g: I had surgery on my back"
                value={form.surgeryDetails} onChange={handleChange} rows={4} />
            </div>
          )}
        </div>
      )}

      {/* ── Step 6: Your contacts ─────────────────────── */}
      {step === 6 && (
        <div className="qf-step-body">
          <div className="qf-field-row">
            <div className="qf-field">
              <label className="qf-label">Emergency contact's name.</label>
              <input className="qf-input" type="text" name="contactName"
                placeholder="e.g: John Doe." value={form.contactName} onChange={handleChange} />
            </div>
            <div className="qf-field">
              <label className="qf-label">Emergency contact's relation.</label>
              <input className="qf-input" type="text" name="contactRelation"
                placeholder="e.g: Aunt." value={form.contactRelation} onChange={handleChange} />
            </div>
          </div>

          <div className="qf-field-row">
            <div className="qf-field">
              <label className="qf-label">Emergency contact's phone number.</label>
              <input className="qf-input" type="tel" name="contactPhone"
                placeholder="1 (###) ###-####" value={form.contactPhone} onChange={handleChange} />
            </div>
            <div className="qf-field">
              <label className="qf-label">Emergency contact's email.</label>
              <input className="qf-input" type="email" name="contactEmail"
                placeholder="e.g: johndoe@gmail.com" value={form.contactEmail} onChange={handleChange} />
            </div>
          </div>

          <div className="qf-field">
            <label className="qf-label">What's their preferred method of contact?</label>
            <PillRadio
              options={['Phone', 'Email']}
              value={form.contactMethod}
              onChange={v => set('contactMethod', v)} />
          </div>
        </div>
      )}

      {/* ── Step 7: Review ───────────────────────────── */}
      {step === 7 && (
        <div className="qf-review">
          {[
            {
              key: 'general', title: 'General Information',
              rows: [
                { q: 'Name',          v: form.fullName    || '—' },
                { q: 'Date of birth', v: form.dateOfBirth || '—' },
                { q: 'Phone',         v: form.phone       || '—' },
                { q: 'Email',         v: form.email       || '—' },
              ]
            },
            {
              key: 'condition', title: 'Your Condition',
              rows: [
                { q: 'Reason for visit', v: form.reason || '—' },
                { q: 'Preferred date',   v: form.appointmentDate
                    ? form.appointmentDate.toLocaleDateString() : '—' },
                { q: 'Preferred time',   v: form.appointmentTime || '—' },
              ]
            },
            {
              key: 'documents', title: 'Your Documents',
              rows: [
                { q: 'Government ID',   v: form.govId     instanceof File ? `✓ ${form.govId.name}`     : '—' },
                { q: 'Insurance card',  v: form.insurance instanceof File ? `✓ ${form.insurance.name}` : '—' },
              ]
            },
            {
              key: 'symptoms', title: 'Your Symptoms',
              rows: [
                { q: 'Duration',    v: form.duration    || '—' },
                { q: 'Pain level',  v: form.painLevel ? `${form.painLevel}/10` : '—' },
                { q: 'Symptoms',    v: form.symptoms.join(', ') || '—' },
                { q: 'Emergency',   v: form.isEmergency || '—', danger: form.isEmergency === 'Yes' },
              ]
            },
            {
              key: 'ailments', title: 'Your Ailments',
              rows: [
                { q: 'Condition',    v: form.condition   || '—' },
                { q: 'Allergies',    v: form.allergies.join(', ')   || '—' },
                { q: 'Medications',  v: form.medications.join(', ') || '—' },
              ]
            },
            {
              key: 'surgeries', title: 'Your Surgeries',
              rows: [
                { q: 'Previous surgery', v: form.hadSurgery      || '—' },
                { q: 'Details',          v: form.surgeryDetails  || '—' },
              ]
            },
            {
              key: 'contacts', title: 'Emergency Contact',
              rows: [
                { q: 'Name',     v: form.contactName     || '—' },
                { q: 'Relation', v: form.contactRelation || '—' },
                { q: 'Phone',    v: form.contactPhone    || '—' },
                { q: 'Email',    v: form.contactEmail    || '—' },
                { q: 'Preferred contact', v: form.contactMethod || '—' },
              ]
            },
          ].map(({ key, title, rows }) => (
            <div key={key} className="qf-accordion">
              <button className="qf-accordion-head"
                onClick={() => setOpenSection(s => s === key ? null : key)}>
                <span className="qf-accordion-title">{title}</span>
                <span className="qf-accordion-arrow">{openSection === key ? <img src={right} className="qf-icon" /> : <img src={down} className="qf-icon" />}</span>
              </button>

              {openSection === key && (
                <div className="qf-accordion-body">
                  {rows.map(({ q, v, danger }) => (
                    <div key={q} className="qf-review-row">
                      <span className="qf-review-q">{q}</span>
                      <span className={`qf-review-v${danger ? ' danger' : ''}`}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────── */}
      <div className="qf-nav">
        <div className="qf-nav-btns">
          <button className="qf-nav-btn" onClick={goBack}
            disabled={step === 0} aria-label="Back">
            <img src={left} alt="Back" className="nav-icon" />
          </button>
          {step < 7 ? (
            <button className="qf-nav-btn qf-nav-btn--active" onClick={goNext} aria-label="Next">
              <img src={right} alt="Next" className="nav-icon" />
            </button>
          ) : (
            <button className="qf-nav-btn qf-nav-btn--submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'SUBMIT'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const AVATAR_COLORS = ['#1a56db', '#2D9C9C', '#8B5CF6']


// ══════════════════════════════════════════════════════════
//  FIND MY APPOINTMENT  (Image 6 → Image 4)
// ══════════════════════════════════════════════════════════
function FindAppointmentForm({ onQueueIn, onBack }) {
  const [name,  setName]  = useState('')
  const [dob,   setDob]   = useState('')
  const [phone, setPhone] = useState('')

  const [searched,       setSearched]       = useState(false)
  const [appointments,   setAppointments]   = useState([])
  const [selectedId,     setSelectedId]     = useState(null)
  const [loadingSearch,  setLoadingSearch]  = useState(false)
  const [loadingQueueIn, setLoadingQueueIn] = useState(false)
  const [error,          setError]          = useState('')

  // Normalize phone to digits-only before sending so it matches
  // what the backend stored from the join form.
  const normalizePhone = (p) => p.replace(/\D/g, '')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!name || !dob || !phone) { setError('Please fill in all fields'); return }
    setError(''); setLoadingSearch(true)
    try {
      const response = await fetch(`${API_URL}/api/queue/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          dob,
          phone: normalizePhone(phone),
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Search failed')
      setAppointments(data.data.appointments)
      setSearched(true)
      if (data.data.appointments.length) setSelectedId(data.data.appointments[0].id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleQueueIn = async () => {
    if (!selectedId) return
    setLoadingQueueIn(true); setError('')
    try {
      const response = await fetch(`${API_URL}/api/queue/${selectedId}/queue-in`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to queue in')
      onQueueIn(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingQueueIn(false)
    }
  }

  // ── Pre-search ────────────────────────────────────────────
  if (!searched) {
    return (
      <div className="qf-find">
        {onBack && (
          <button type="button" className="qf-back-btn" onClick={onBack}>
            <img src={left} className="qf-icon" />
            <p className="qf-btn-title">Back</p>
          </button>
        )}

        <h3 className="qf-find-heading">Let's search!</h3>
        <p className="qf-find-sub">
          We need a few details to find your appointment.{' '}
          <span className="qf-find-sub-blue">
            Use the same details you entered when you joined.
          </span>
        </p>

        <form onSubmit={handleSearch} className="qf-step-body-search">
          <div className="qf-field">
            <label className="qf-label">Full Name</label>
            <input className="qf-input" type="text" placeholder="Enter your full name"
              value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="qf-field-row">
            <div className="qf-field">
              <label className="qf-label">Date of Birth</label>
              <input className="qf-input" type="date"
                value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div className="qf-field">
              <label className="qf-label">Phone Number</label>
              <input className="qf-input" type="tel" placeholder="+1 (###) ###-####"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          {error && <p className="qf-error">{error}</p>}

          <button type="submit" className="qf-join-btn" disabled={loadingSearch}>
            {loadingSearch ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>
    )
  }

  // ── No results ────────────────────────────────────────────
  if (appointments.length === 0) {
    return (
      <div className="qf-find">
        {onBack && (
          <button type="button" className="qf-back-btn" onClick={onBack}>
            <img src={left} className="qf-icon" />
            <p className="qf-btn-title">Back</p>
          </button>
        )}

        <h3 className="qf-find-heading">No appointments found</h3>
        <p className="qf-find-sub">
          We couldn't find any active appointments with those details.{' '}
          <span className="qf-find-sub-blue">
            Double-check that your name, date of birth, and phone number are
            exactly as you entered them when you joined the queue.
          </span>
        </p>
        
        <button className="qf-join-btn" onClick={() => { setSearched(false); setError('') }}>
          Try again
        </button>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────
  return (
    <div className="qf-find">
      <button type="button" className="qf-back-btn"         
        onClick={() => { setSearched(false); setError('') }}>
        <img src={left} className="qf-icon" />
        <p className="qf-btn-title">Back</p>
      </button>

      <h3 className="qf-find-heading">Let's search!</h3>
      
      <p className="qf-find-sub">
        We found{' '}
        <span className="qf-find-sub-blue">
          {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
        </span>{' '}
        for you. Which are you checking in for?
      </p>

      <div className="qf-appt-list">
        {appointments.map((a, i) => (
          <button key={a.id} type="button"
            className={`qf-appt-card${selectedId === a.id ? ' selected' : ''}`}
            onClick={() => setSelectedId(a.id)}>

            <div className="qf-appt-avatar"
              style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
              {getInitials(a.doctor)}
            </div>

            <div className="qf-appt-doc">
              <span className="qf-appt-doctor">{a.doctor}</span>
              <span className="qf-appt-role">
                {a.status === 'queued' ? 'Already in queue' : 'Pending check-in'}
              </span>
            </div>

            <div className="qf-appt-type">
              <span className="qf-appt-type-name">{a.type || 'General visit'}</span>
              <span className="qf-appt-patient">for {a.patient}</span>
            </div>

            <div className="qf-appt-time">
              {a.queueId ? (
                <span className="qf-appt-queue-id">{a.queueId}</span>
              ) : (
                <>
                  <span className="qf-appt-time-val">{a.time || '—'}</span>
                  <span className="qf-appt-date">
                    {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                  </span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && <p className="qf-error">{error}</p>}

      <button className="qf-join-btn" onClick={handleQueueIn}
        disabled={!selectedId || loadingQueueIn}>
        {loadingQueueIn ? 'Joining queue...' : 'Queue in'}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  YOU'RE IN THE QUEUE  (Image 5)
// ══════════════════════════════════════════════════════════
function QueueWaitingScreen({ appointment, onExit }) {
  const [muted, setMuted] = useState(false)
  const [live, setLive] = useState(appointment)
  const [secondsLeft, setSecondsLeft] = useState((appointment?.estimatedWaitMinutes || 15) * 60)

  // Local ticking countdown between polls
  useEffect(() => {
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  // Periodic resync with the server — corrects drift and picks up status
  // changes (e.g. when staff calls this patient in)
  useEffect(() => {
    if (!appointment?.id) return
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/queue/status/${appointment.id}`)
        const data = await res.json()
        if (data.success) {
          setLive(data.data)
          setSecondsLeft((data.data.estimatedWaitMinutes || 0) * 60)
        }
      } catch { /* keep showing last-known state if a poll fails */ }
    }
    const id = setInterval(poll, 20000)
    return () => clearInterval(id)
  }, [appointment?.id])

  const hours   = String(Math.floor(secondsLeft / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0')
  const beingCalled = live?.status === 'called' || live?.status === 'in_progress'

  const handleExit = () => {
    if (window.confirm('Are you sure you want to leave the queue? You will lose your position.')) onExit?.()
  }

  return (
    <div className="qw-screen">
      <h1 className="qw-heading">{beingCalled ? "You're being called!" : "You're in the queue"}</h1>
      <p className="qw-sub">
        {beingCalled
          ? <span className="qw-sub-blue">Please make your way to {live?.room || 'the front desk'} now.</span>
          : <>All there's left to do is{' '}<span className="qw-sub-blue">wait for your number to be called.</span></>}
      </p>

      <div className="qw-card">
        <div className="qw-card-handle" />
        <div className="qw-appt-row">
          <div>
            <p className="qw-appt-type">{live?.type || appointment?.type || 'General Consultation'}</p>
            <p className="qw-appt-for">
              for <span className="qw-appt-name">{live?.patient || appointment?.patient || 'You'}</span>{' '}
              with <span className="qw-appt-name">{live?.doctor || appointment?.doctor || 'Dr. White'}</span>
            </p>
          </div>
          <div className="qw-appt-time-block">
            <p className="qw-appt-time-val">{live?.time || appointment?.time || '9:00 PM'}</p>
            <p className="qw-appt-date">{live?.date || appointment?.date || ''}</p>
          </div>
        </div>

        <div className="qw-queue-box">
          <span className="qw-queue-num">{live?.queueId || appointment?.queueId || '—'}</span>
          <span className="qw-queue-ahead">
            <span className="qw-queue-ahead-blue">{live?.peopleAhead ?? appointment?.peopleAhead ?? 0} people</span>{' '}ahead of you
          </span>
        </div>

        <div className="qw-timer-box">
          <div className="qw-timer-progress" />
          <button className="qw-timer-btn" onClick={() => setMuted(m => !m)} aria-label="Toggle notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              {muted ? (
                <path d="M3 3l18 18M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0018 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>

          <div className="qw-timer-display">
            <div className="qw-timer-unit"><span className="qw-timer-num">{hours}</span><span className="qw-timer-label">Hour</span></div>
            <span className="qw-timer-colon">:</span>
            <div className="qw-timer-unit"><span className="qw-timer-num">{minutes}</span><span className="qw-timer-label">Minute</span></div>
          </div>
          <button className="qw-timer-close" onClick={handleExit} aria-label="Leave queue">×</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  CODE ENTRY FORM — now stage-aware
//  stage: 'code' | 'find' | 'waiting'
// ══════════════════════════════════════════════════════════
export function QueueCodeForm() {
  const inputRefs = useRef([])
  const [stage,   setStage]   = useState('code')
  const [digits,  setDigits]  = useState(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [confirmedAppt, setConfirmedAppt] = useState(null)

  useEffect(() => {
    if (stage === 'code') inputRefs.current[0]?.focus()
  }, [stage])

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]; next[index] = value
    setDigits(next); setError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus()
  }

  const handlePaste = e => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next   = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleJoin = async () => {
    const code = digits.join('')
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return }
    setLoading(true); setError('')
    try {
      const response = await fetch(`${API_URL}/api/queue/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Invalid code. Please try again.')
      setConfirmedAppt(data.data)
      setStage('waiting')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Stage: searching for appointment ──────────────────
  if (stage === 'find') {
    return (
      <FindAppointmentForm
        onQueueIn={(appt) => { setConfirmedAppt(appt); setStage('waiting') }}
        onBack={() => setStage('code')}
      />
    )
  }

  // ── Stage: confirmed, waiting in queue ─────────────────
  if (stage === 'waiting') {
    return (
      <QueueWaitingScreen
        appointment={confirmedAppt}
        onExit={() => { setStage('code'); setDigits(Array(6).fill('')); setConfirmedAppt(null) }}
      />
    )
  }

  // ── Stage: default code entry ──────────────────────────
  return (
    <div className="qf-code">
      <h3 className="qf-code-heading">Enter your code</h3>
      <p className="qf-code-sub">
        We sent a 6-digit code to your email.{' '}
        <span className="qf-code-sub-blue">Enter it below to join the queue.</span>
      </p>
      <div className="qf-digits">
        <div className="qf-digit-group qf-digit-group--active">
          {[0,1,2].map(i => (
            <input key={i} ref={el => (inputRefs.current[i] = el)}
              className="qf-digit" type="text" inputMode="numeric"
              maxLength={1} value={digits[i]}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste} />
          ))}
        </div>

        <div className="qf-digit-group">
          {[3,4,5].map(i => (
            <input key={i} ref={el => (inputRefs.current[i] = el)}
              className="qf-digit" type="text" inputMode="numeric"
              maxLength={1} value={digits[i]}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste} />
          ))}
        </div>
      </div>
      {error && <p className="qf-error">{error}</p>}
      <p className="qf-code-fallback">
        Didn't get a code?{' '}
        <button type="button" className="qf-link-btn" onClick={() => setStage('find')}>
          Let's search for your appointment.
        </button>
      </p>

      <button className="qf-join-btn" onClick={handleJoin}
        disabled={loading || digits.join('').length < 6}>
        {loading ? 'Joining...' : 'Join'}
      </button>
    </div>
  )
}