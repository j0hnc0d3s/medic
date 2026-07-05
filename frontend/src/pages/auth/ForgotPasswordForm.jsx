// ─────────────────────────────────────────────────────────
// FILE : src/pages/auth/ForgotPasswordForm.jsx
// ─────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import './ForgotPasswordForm.css'

const API_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:5173'
const STEPS = ['Your details', 'Your code', 'Your password']

function SimpleStepBar({ currentIndex }) {
  return (
    <div className="frp-stepbar">
      {STEPS.map((label, i) => {
        const isCurrent = i === currentIndex
        const isNext    = i === currentIndex + 1
        const isPast    = i < currentIndex
        return (
          <div key={label}
            className={`frp-step${isNext ? ' next' : ''}${isCurrent ? ' current' : ''}${isPast ? ' past' : ''}`}>
            {isNext && <span className="frp-step-next-label">Next</span>}
            <span className="frp-step-num">Step {String(i + 1).padStart(2, '0')}</span>
            {isCurrent && <span className="frp-step-sub">{label}</span>}
          </div>
        )
      })}
    </div>
  )
}

export function ForgotPasswordForm({ onStepChange, onComplete, onFindAppointment }) {
  const [step, setStep]     = useState(0)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Step 0
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob]     = useState('')

  // Step 1 — stored after verify so step 2 can use it
  const inputRefs = useRef([])
  const [digits, setDigits]   = useState(Array(6).fill(''))
  const [resetId, setResetId] = useState('')  // doc ID returned by verify-reset-code

  // Step 2
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => { onStepChange?.(step) }, [step])
  useEffect(() => { if (step === 1) inputRefs.current[0]?.focus() }, [step])

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
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  // ── Step 0 → request reset code ─────────────────────────
  const handleDetailsNext = async (e) => {
    e.preventDefault()
    if (!email || !phone || !dob) { setError('Please fill in all fields'); return }
    setError(''); setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      // Backend always returns 200 here (doesn't reveal if email exists) —
      // any non-network error still lets us move forward so an attacker
      // can't enumerate valid emails.
      if (!response.ok) throw new Error(data.error || 'Failed to send reset code')

      setStep(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1 → verify code ─────────────────────────────────
  const handleCodeNext = async (e) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 6) { setError('Please enter the full 6-digit code'); return }
    setError(''); setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) throw new Error(data.error || 'Invalid or expired code')

      // Store the reset document ID — needed to authorize the final password change
      setResetId(data.data.token)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2 → reset password ──────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, resetId }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to reset password')

      onComplete?.()  // switches Login.jsx back to the login tab
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="frp-flow">
      <SimpleStepBar currentIndex={step} />

      {/* ── Step 0 ── */}
      {step === 0 && (
        <form onSubmit={handleDetailsNext} className="frp-form">
          <h2 className="frp-step-heading">Enter your details</h2>
          <p className="frp-step-sub">Enter your email, number and date of birth linked to your account.</p>

          <input className="frp-input" type="email" placeholder="Enter your email"
            value={email} onChange={e => setEmail(e.target.value)} required />

          <input className="frp-input" type="tel" placeholder="Enter your phone number"
            value={phone} onChange={e => setPhone(e.target.value)} required />

          <input className="frp-input" type="date"
            value={dob} onChange={e => setDob(e.target.value)} required />

          {error && <p className="frp-error">{error}</p>}

          <button type="submit" className="frp-btn" disabled={loading}>
            {loading ? 'Sending code...' : 'Next'}
          </button>
        </form>
      )}

      {/* ── Step 1 ── */}
      {step === 1 && (
        <form onSubmit={handleCodeNext} className="frp-form">
          <h2 className="frp-step-heading">Enter your code</h2>
          <p className="frp-step-sub">
            We sent a 6-digit code to your email.{' '}
            <span className="frp-step-sub-blue">Enter it below to reset your password.</span>
          </p>

          <div className="frp-digits">
            <div className="frp-digit-group frp-digit-group--active">
              {[0, 1, 2].map(i => (
                <input key={i} ref={el => (inputRefs.current[i] = el)}
                  className="frp-digit" type="text" inputMode="numeric" maxLength={1}
                  value={digits[i]}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste} />
              ))}
            </div>
            <div className="frp-digit-group">
              {[3, 4, 5].map(i => (
                <input key={i} ref={el => (inputRefs.current[i] = el)}
                  className="frp-digit" type="text" inputMode="numeric" maxLength={1}
                  value={digits[i]}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={handlePaste} />
              ))}
            </div>
          </div>

          <p className="frp-fallback">
            Didn't get a code?{' '}
            <button type="button" className="frp-link-btn" onClick={() => setStep(0)}>
              Try again.
            </button>
          </p>

          {error && <p className="frp-error">{error}</p>}

          <button type="submit" className="frp-btn" disabled={loading || digits.join('').length < 6}>
            {loading ? 'Verifying...' : 'Next'}
          </button>
        </form>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <form onSubmit={handleReset} className="frp-form">
          <h2 className="frp-step-heading">Enter your new password</h2>
          <p className="frp-step-sub-blue-full">Enter it below to reset your password.</p>

          <input className="frp-input" type="password" placeholder="Enter your new password"
            value={newPassword} onChange={e => setNewPassword(e.target.value)} required />

          <input className="frp-input" type="password" placeholder="Confirm your new password"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

          {error && <p className="frp-error">{error}</p>}

          <button type="submit" className="frp-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset'}
          </button>
        </form>
      )}
    </div>
  )
}