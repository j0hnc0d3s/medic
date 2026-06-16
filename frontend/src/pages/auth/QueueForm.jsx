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

import leftImg  from '../../assets/images/left.png'
import rightImg from '../../assets/images/right.png'

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

  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) onAdd(val)
    setInput('')
  }

  return (
    <div className="qf-tag-input-wrap">
      <input
        className="qf-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
        }}
        placeholder={placeholder}
      />
      {tags.length > 0 && (
        <div className="qf-tags">
          {tags.map(t => (
            <span key={t} className="qf-tag">
              {t}
              <button className="qf-tag-remove" onClick={() => onRemove(t)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// File drop zone
function FileDropZone({ label, onFile }) {
  const ref  = useRef()
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)

  const handle = f => { setFile(f); onFile?.(f) }

  return (
    <div
      className={`qf-dropzone${drag ? ' drag' : ''}${file ? ' has-file' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true)  }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      onClick={() => ref.current.click()}>
      <input ref={ref} type="file" hidden onChange={e => handle(e.target.files[0])} />
      {file ? (
        <p className="qf-dropzone-name">✓ {file.name}</p>
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
  // Show 4 steps: anchor window so current + next are always visible
  const start   = Math.max(1, Math.min(currentStep - 1, STEPS.length - 3))
  const visible = STEPS.slice(start - 1, start + 3)  // up to 4
 
  return (
    <div className="qf-step-indicator">
      {visible.map((s, i) => {
        const isCurrent = s.num === currentStep
        const isNext    = s.num === currentStep + 1
        const isPast    = s.num < currentStep
 
        if (isCurrent) {
          return (
            <div key={s.num} className="qf-si-pill qf-si-pill--current">
              <span className="qf-si-num">Step {String(s.num).padStart(2,'0')}</span>
              <span className="qf-si-sub">{s.label}</span>
            </div>
          )
        }
 
        if (isNext) {
          return (
            <div key={s.num} className="qf-si-pill qf-si-pill--next">
              <span className="qf-si-next-label">Next</span>
              <span className="qf-si-num">Step {String(s.num).padStart(2,'0')}</span>
            </div>
          )
        }
 
        // Past or far future — plain text only
        return (
          <span key={s.num} className={`qf-si-plain${isPast ? ' past' : ''}`}>
            Step {String(s.num).padStart(2,'0')}
          </span>
        )
      })}
    </div>
  )
}


// ══════════════════════════════════════════════════════════
//  MAIN FORM
// ══════════════════════════════════════════════════════════
export function QueueJoinForm({ onStepChange }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

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
  const addTag   = (key, val)  => set(key, [...form[key], val])
  const removeTag = (key, val) => set(key, form[key].filter(t => t !== val))

  const goNext = () => setStep(s => s + 1)
  const goBack = () => setStep(s => Math.max(0, s - 1))

  const handleSubmit = () => {
    console.log('Queue submission:', form)
    navigate('/queue/confirmation')
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
            <input className="qf-slider" type="range" min={1} max={10}
              value={form.painLevel}
              onChange={e => set('painLevel', Number(e.target.value))} />
            <div className="qf-slider-ticks">
              {Array.from({length:10},(_,i)=>(
                <span key={i} className={form.painLevel >= i+1 ? 'active' : ''}>{i+1}</span>
              ))}
            </div>
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
            <FileDropZone onFile={f => set('govId', f)} />
          </div>

          <div className="qf-field">
            <label className="qf-label">
              If applicable, please provide your insurance details.{' '}
              <span className="qf-label-eg">e.g: front, and back of card.</span>
            </label>
            <FileDropZone onFile={f => set('insurance', f)} />
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
                <span className="qf-accordion-arrow">{openSection === key ? '↓' : '→'}</span>
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
            <img src={leftImg} alt="Back" className="nav-icon" />
          </button>
          {step < 7 ? (
            <button className="qf-nav-btn qf-nav-btn--active" onClick={goNext} aria-label="Next">
              <img src={rightImg} alt="Next" className="nav-icon" />
            </button>
          ) : (
            <button className="qf-nav-btn qf-nav-btn--submit" onClick={handleSubmit}>
              SUBMIT
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════
//  CODE ENTRY FORM (unchanged)
// ══════════════════════════════════════════════════════════
export function QueueCodeForm() {
  const navigate  = useNavigate()
  const inputRefs = useRef([])
  const [digits,  setDigits]  = useState(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

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
    setLoading(true)
    try { navigate('/queue/confirmation') }
    catch { setError('Invalid code. Please try again.') }
    finally { setLoading(false) }
  }

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
        <a href="/queue/find-appointment">Let's search for your appointment.</a>
      </p>

      <button className="qf-join-btn" onClick={handleJoin}
        disabled={loading || digits.join('').length < 6}>
        {loading ? 'Joining...' : 'Join'}
      </button>
    </div>
  )
}