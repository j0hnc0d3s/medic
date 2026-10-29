import { useRef, useState } from 'react'
import { queueApi } from '../api.js'

const SYMPTOM_OPTIONS = [
  'Chest pain or pressure',
  'Shortness of breath',
  'Fever',
  'Severe headache',
  'Abdominal pain',
  'Nausea or vomiting',
  'Dizziness or fainting',
  'Injury or possible fracture',
  'Cut or wound',
  'Allergic reaction',
  'Cough or cold symptoms',
  'Something else',
]

const CONTACT_METHODS = ['Phone call', 'Text message', 'Email']

const emptyForm = {
  fullName: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  reason: '',
  isEmergency: '',
  painLevel: null,
  symptoms: [],
  duration: '',
  condition: '',
  allergies: '',
  medications: '',
  hadSurgery: '',
  surgeryDetails: '',
  contactName: '',
  contactRelation: '',
  contactPhone: '',
  contactEmail: '',
  contactMethod: '',
  govId: null,
  insurance: null,
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result || ''
      const base64 = String(result).split(',')[1] || ''
      resolve({ name: file.name, type: file.type, data: base64 })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const STEP_TITLES = [
  'Your details',
  'Visit details',
  'Medical history',
  'Emergency contact',
  'Documents',
  'Review',
  'Verify',
]

export default function NewIntake({ onDone }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [entryId, setEntryId] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const codeRefs = useRef([])

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))
  const onInput = (key) => (e) => set(key)(e.target.value)

  const toggleSymptom = (s) => {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter((x) => x !== s)
        : [...f.symptoms, s],
    }))
  }

  const stepValid = [
    form.fullName.trim() && form.phone.trim() && form.email.trim() && form.reason.trim(),
    form.isEmergency && form.painLevel != null,
    true,
    true,
    true,
    true,
    true,
  ][step]

  const goNext = () => setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1))
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleFile = (key) => async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const payload = await fileToPayload(file)
    set(key)({ ...payload, _fileName: file.name })
  }

  const handleSubmitIntake = async () => {
    setSubmitting(true)
    setError('')
    try {
      const data = await queueApi.join({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        phone: form.phone,
        email: form.email,
        reason: form.reason,
        isEmergency: form.isEmergency,
        painLevel: form.painLevel,
        symptoms: form.symptoms,
        duration: form.duration,
        condition: form.condition,
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        medications: form.medications ? form.medications.split(',').map((s) => s.trim()).filter(Boolean) : [],
        hadSurgery: form.hadSurgery,
        surgeryDetails: form.surgeryDetails,
        contactName: form.contactName,
        contactRelation: form.contactRelation,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        contactMethod: form.contactMethod,
        govId: form.govId,
        insurance: form.insurance,
      })
      setEntryId(data.queueEntryId)
      goNext()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCodeChange = (i) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    setCode((c) => {
      const next = [...c]
      next[i] = val
      return next
    })
    if (val && i < 5) codeRefs.current[i + 1]?.focus()
  }

  const handleCodeKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs.current[i - 1]?.focus()
  }

  const handleVerify = async () => {
    const joined = code.join('')
    if (joined.length !== 6) return
    setSubmitting(true)
    setError('')
    try {
      const data = await queueApi.verifyCode(joined)
      setConfirmed(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <div className="panel-dark">
        <span className="eyebrow-pill">Queue pass</span>
        <h1>You're in the queue</h1>
        <p className="lede">
          Please take a seat. We'll call your queue code when it's your turn — watch the display board near the waiting area.
        </p>
        <div className="confirm-code">
          <div className="label">Your queue code</div>
          <div className="code">{confirmed.queueId}</div>
          <div className="name">{confirmed.patient}</div>
        </div>
        <div className="status-grid">
          <div className="status-tile">
            <div className="num">{confirmed.peopleAhead ?? 0}</div>
            <div className="lbl">People ahead</div>
          </div>
          <div className="status-tile">
            <div className="num">{confirmed.estimatedWaitMinutes != null ? `~${confirmed.estimatedWaitMinutes}m` : '—'}</div>
            <div className="lbl">Est. wait time</div>
          </div>
        </div>
        <p className="lede" style={{ marginTop: '18px', fontSize: '0.85rem' }}>
          A confirmation with this code was also sent to your email.
        </p>
        <button className="btn-primary on-dark" style={{ marginTop: '18px' }} onClick={onDone}>
          Done
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="panel-dark">
        <span className="eyebrow-pill">Patient intake</span>
        <h1>Let's get you queued up</h1>
        <p className="lede">Please enter your details to join the Emergency Department queue.</p>
        <div className="step-track">
          <div className="step-track-label">
            <span>Step {step + 1} of {STEP_TITLES.length}</span>
            <span>{STEP_TITLES[step]}</span>
          </div>
          <div className="step-track-bar">
            <div className="step-track-fill" style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="panel-light">
        {error && <div className="banner error">{error}</div>}

        {step === 0 && (
          <>
            <div className="field-group">
              <label htmlFor="fullName">What's your full name?</label>
              <input id="fullName" type="text" placeholder="e.g. John Doe" value={form.fullName} onChange={onInput('fullName')} />
            </div>
            <div className="field-group">
              <label htmlFor="dob">Date of birth</label>
              <input id="dob" type="date" value={form.dateOfBirth} onChange={onInput('dateOfBirth')} />
            </div>
            <div className="field-group">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" placeholder="+1 (876) 555-0199" value={form.phone} onChange={onInput('phone')} />
            </div>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={onInput('email')} />
              <div className="field-hint">We'll send your queue code here.</div>
            </div>
            <div className="field-group">
              <label htmlFor="reason">What brings you in today?</label>
              <textarea id="reason" placeholder="e.g. Chest pain, fever, follow-up, difficulty breathing..." value={form.reason} onChange={onInput('reason')} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="field-group">
              <label>Is this a medical emergency?</label>
              <div className="yesno-row">
                <button type="button" className="urgent" aria-pressed={form.isEmergency === 'Yes'} onClick={() => set('isEmergency')('Yes')}>Yes</button>
                <button type="button" aria-pressed={form.isEmergency === 'No'} onClick={() => set('isEmergency')('No')}>No</button>
              </div>
            </div>
            <div className="field-group">
              <label>How would you rate your pain, 1 to 10?</label>
              <div className="pain-scale">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button type="button" key={n} aria-pressed={form.painLevel === n} onClick={() => set('painLevel')(n)}>{n}</button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label>Which of these apply? (optional)</label>
              <div className="pill-options">
                {SYMPTOM_OPTIONS.map((s) => (
                  <button type="button" key={s} className="pill-option" aria-pressed={form.symptoms.includes(s)} onClick={() => toggleSymptom(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="duration">How long has this been going on?</label>
              <input id="duration" type="text" placeholder="e.g. Since this morning, 3 days" value={form.duration} onChange={onInput('duration')} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="field-group">
              <label htmlFor="condition">Any existing conditions we should know about?</label>
              <textarea id="condition" placeholder="e.g. Diabetes, hypertension — leave blank if none" value={form.condition} onChange={onInput('condition')} />
            </div>
            <div className="field-group">
              <label htmlFor="allergies">Allergies</label>
              <input id="allergies" type="text" placeholder="Separate with commas — leave blank if none" value={form.allergies} onChange={onInput('allergies')} />
            </div>
            <div className="field-group">
              <label htmlFor="medications">Current medications</label>
              <input id="medications" type="text" placeholder="Separate with commas — leave blank if none" value={form.medications} onChange={onInput('medications')} />
            </div>
            <div className="field-group">
              <label>Any surgery in the past year?</label>
              <div className="yesno-row">
                <button type="button" aria-pressed={form.hadSurgery === 'Yes'} onClick={() => set('hadSurgery')('Yes')}>Yes</button>
                <button type="button" aria-pressed={form.hadSurgery === 'No'} onClick={() => set('hadSurgery')('No')}>No</button>
              </div>
            </div>
            {form.hadSurgery === 'Yes' && (
              <div className="field-group">
                <label htmlFor="surgeryDetails">Tell us briefly what it was</label>
                <textarea id="surgeryDetails" value={form.surgeryDetails} onChange={onInput('surgeryDetails')} />
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 0 }}>Optional, but helpful if staff need to reach someone on your behalf.</p>
            <div className="field-group">
              <label htmlFor="contactName">Contact's name</label>
              <input id="contactName" type="text" value={form.contactName} onChange={onInput('contactName')} />
            </div>
            <div className="field-group">
              <label htmlFor="contactRelation">Relationship to you</label>
              <input id="contactRelation" type="text" placeholder="e.g. Spouse, parent, friend" value={form.contactRelation} onChange={onInput('contactRelation')} />
            </div>
            <div className="field-group">
              <label htmlFor="contactPhone">Their phone number</label>
              <input id="contactPhone" type="tel" value={form.contactPhone} onChange={onInput('contactPhone')} />
            </div>
            <div className="field-group">
              <label htmlFor="contactEmail">Their email</label>
              <input id="contactEmail" type="email" value={form.contactEmail} onChange={onInput('contactEmail')} />
            </div>
            <div className="field-group">
              <label>Preferred way to reach them</label>
              <div className="pill-options">
                {CONTACT_METHODS.map((m) => (
                  <button type="button" key={m} className="pill-option" aria-pressed={form.contactMethod === m} onClick={() => set('contactMethod')(m)}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 0 }}>
              Optional. If you have these on you, it speeds up your visit — you can skip and bring them to the desk instead.
            </p>
            <div className="field-group">
              <label>Government ID</label>
              <div className="upload-row">
                <div className="upload-icon">🪪</div>
                <div className="upload-text">
                  <strong>{form.govId ? form.govId._fileName : 'No file selected'}</strong>
                  <span>Photo or scan, JPG/PNG/PDF</span>
                </div>
                <label htmlFor="govId">Choose</label>
                <input id="govId" type="file" accept="image/*,.pdf" onChange={handleFile('govId')} />
              </div>
            </div>
            <div className="field-group">
              <label>Insurance card</label>
              <div className="upload-row">
                <div className="upload-icon">🩺</div>
                <div className="upload-text">
                  <strong>{form.insurance ? form.insurance._fileName : 'No file selected'}</strong>
                  <span>Photo or scan, JPG/PNG/PDF</span>
                </div>
                <label htmlFor="insurance">Choose</label>
                <input id="insurance" type="file" accept="image/*,.pdf" onChange={handleFile('insurance')} />
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 0 }}>Check this over before joining the queue.</p>
            <dl className="review-list">
              <div className="review-row"><dt>Name</dt><dd>{form.fullName || '—'}</dd></div>
              <div className="review-row"><dt>Date of birth</dt><dd>{form.dateOfBirth || '—'}</dd></div>
              <div className="review-row"><dt>Phone</dt><dd>{form.phone || '—'}</dd></div>
              <div className="review-row"><dt>Email</dt><dd>{form.email || '—'}</dd></div>
              <div className="review-row"><dt>Reason for visit</dt><dd>{form.reason || '—'}</dd></div>
              <div className="review-row"><dt>Emergency</dt><dd>{form.isEmergency || '—'}</dd></div>
              <div className="review-row"><dt>Pain level</dt><dd>{form.painLevel ?? '—'} / 10</dd></div>
              <div className="review-row"><dt>Symptoms</dt><dd>{form.symptoms.length ? form.symptoms.join(', ') : 'None selected'}</dd></div>
              <div className="review-row"><dt>Emergency contact</dt><dd>{form.contactName || 'Not provided'}</dd></div>
              <div className="review-row"><dt>Documents</dt><dd>{[form.govId && 'ID', form.insurance && 'Insurance'].filter(Boolean).join(', ') || 'None attached'}</dd></div>
            </dl>
          </>
        )}

        {step === 6 && (
          <>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', marginTop: 0 }}>
              We emailed a 6-digit code to <strong>{form.email}</strong>. Enter it below to join the queue.
            </p>
            <div className="code-boxes">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (codeRefs.current[i] = el)}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={handleCodeChange(i)}
                  onKeyDown={handleCodeKeyDown(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="panel-light" style={{ paddingTop: 0 }}>
        {step < 5 && (
          <div className="step-actions">
            {step > 0 && <button className="btn-back" onClick={goBack}>Back</button>}
            <button className="btn-primary" disabled={!stepValid} onClick={goNext}>
              Next step
            </button>
          </div>
        )}
        {step === 5 && (
          <div className="step-actions">
            <button className="btn-back" onClick={goBack}>Back</button>
            <button className="btn-primary" disabled={submitting} onClick={handleSubmitIntake}>
              {submitting ? <span className="spinner" /> : 'Join the queue'}
            </button>
          </div>
        )}
        {step === 6 && (
          <button className="btn-primary" disabled={submitting || code.join('').length !== 6} onClick={handleVerify}>
            {submitting ? <span className="spinner" /> : 'Confirm code'}
          </button>
        )}
      </div>
    </>
  )
}
