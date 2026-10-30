import { useState } from 'react'
import { queueApi } from '../api.js'

const initial = { name: '', dob: '', phone: '' }

export default function LookupCode({ onStartIntake }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const canSearch = form.name.trim() && form.dob && form.phone.trim()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!canSearch || loading) return
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await queueApi.find(form)
      setResults(data.appointments || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-light">
      <h1 style={{ fontSize: '1.5rem' }}>Find your place in line</h1>
      <p style={{ color: 'var(--ink-soft)', marginTop: '8px', fontSize: '0.92rem', lineHeight: 1.5 }}>
        Enter the details you registered with to see your queue position and wait time.
      </p>

      <form onSubmit={handleSearch} style={{ marginTop: '22px' }}>
        <div className="field-group">
          <label htmlFor="lookup-name">Full name</label>
          <input
            id="lookup-name"
            type="text"
            placeholder="As entered at check-in"
            value={form.name}
            onChange={set('name')}
            autoComplete="name"
          />
        </div>
        <div className="field-group">
          <label htmlFor="lookup-dob">Date of birth</label>
          <input id="lookup-dob" type="date" value={form.dob} onChange={set('dob')} />
        </div>
        <div className="field-group">
          <label htmlFor="lookup-phone">Phone number</label>
          <input
            id="lookup-phone"
            type="tel"
            placeholder="+1 (876) 555-0199"
            value={form.phone}
            onChange={set('phone')}
            autoComplete="tel"
          />
        </div>

        {error && <div className="banner error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={!canSearch || loading}>
          {loading ? <span className="spinner" /> : 'Check my status'}
        </button>
      </form>

      {results && results.length === 0 && (
        <div className="banner info" style={{ marginTop: '18px' }}>
          We couldn't find an active queue entry with those details. Double-check what you entered, or register below.
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          {results.map((entry) => (
            <div className="result-card" key={entry.id}>
              <div className="code-row">
                <span className="code">{entry.queueId || 'Pending'}</span>
                <span className="status-tag">
                  {entry.status === 'queued' ? 'In queue' : entry.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="status-grid">
                <div className="status-tile">
                  <div className="num">{entry.peopleAhead ?? '—'}</div>
                  <div className="lbl">People ahead</div>
                </div>
                <div className="status-tile">
                  <div className="num">
                    {entry.estimatedWaitMinutes != null ? `~${entry.estimatedWaitMinutes}m` : '—'}
                  </div>
                  <div className="lbl">Est. wait time</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', margin: '0 0 10px' }}>
          Haven't registered yet?
        </p>
        <button className="btn-ghost" style={{ color: 'var(--blue)' }} onClick={onStartIntake}>
          Start new patient intake
        </button>
      </div>
    </div>
  )
}
