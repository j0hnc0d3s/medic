import { useEffect, useRef, useState } from 'react'
import { vitalsApi } from './api.js'
import { SCENARIOS, seedReading, stepReading, round } from './simulate.js'
import logo from './assets/logo.png'

const TICK_MS = 2500

export default function App() {
  const [code, setCode] = useState('') // what the nurse types: queue code (A012) or full id
  const [entryId, setEntryId] = useState('') // resolved channel id used for streaming
  const [connected, setConnected] = useState(null) // { patient, queueId } once verified
  const [connectError, setConnectError] = useState('')
  const [connecting, setConnecting] = useState(false)

  const [scenario, setScenario] = useState('normal')
  const [streaming, setStreaming] = useState(false)
  const [reading, setReading] = useState(null)
  const [log, setLog] = useState([])

  const readingRef = useRef(null)
  const scenarioRef = useRef(scenario)
  const intervalRef = useRef(null)

  useEffect(() => { scenarioRef.current = scenario }, [scenario])
  useEffect(() => { readingRef.current = reading }, [reading])

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!code.trim() || connecting) return
    setConnecting(true)
    setConnectError('')
    try {
      const data = await vitalsApi.resolve(code)
      setEntryId(data.entryId)
      setConnected({ patient: data.patient, queueId: data.queueId })
    } catch (err) {
      setConnectError(err.message)
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    setStreaming(false)
    clearInterval(intervalRef.current)
    setConnected(null)
    setReading(null)
    setLog([])
    setEntryId('')
    setCode('')
  }

  const pushTick = async () => {
    const next = round(stepReading(readingRef.current, scenarioRef.current))
    setReading(next)
    try {
      await vitalsApi.push(entryId, next)
      setLog((l) => [{ ok: true, time: new Date(), hr: next.heartRate }, ...l].slice(0, 8))
    } catch (err) {
      setLog((l) => [{ ok: false, time: new Date(), error: err.message }, ...l].slice(0, 8))
    }
  }

  const toggleStreaming = () => {
    if (streaming) {
      clearInterval(intervalRef.current)
      setStreaming(false)
      return
    }
    const seeded = round(seedReading(scenario))
    setReading(seeded)
    setStreaming(true)
    intervalRef.current = setInterval(pushTick, TICK_MS)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const beatDuration = reading ? `${Math.max(0.35, 60 / reading.heartRate)}s` : '1s'

  if (!connected) {
    return (
      <div className="app-shell">
        <div className="app-topbar">
          <div className="app-brand">
            <img className="app-brand-logo" src={logo} alt="" />
            Medic
          </div>
          <span className="app-mode">Wearable simulator</span>
        </div>
        <div className="watch-shell">
          <div className="channel-card">
            <h1 style={{ fontSize: '1.4rem' }}>Pair this device</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', marginTop: '8px', lineHeight: 1.5 }}>
              Enter the patient's queue code (for example A012) to start streaming
              simulated vitals for them. It's the code they were given when they joined the queue.
            </p>
            <form onSubmit={handleConnect} style={{ marginTop: '20px' }}>
              <div className="field-group">
                <label htmlFor="queueCode">Queue code</label>
                <input
                  id="queueCode"
                  type="text"
                  placeholder="e.g. A012"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {connectError && <div className="banner error">{connectError}</div>}
              <button className="btn-primary" type="submit" disabled={connecting || !code.trim()}>
                {connecting ? <span className="spinner" /> : 'Connect'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <div className="app-brand">
          <img className="app-brand-logo" src={logo} alt="" />
          Medic
        </div>
        <span className="app-mode">
          <span className={`connection-dot ${streaming ? 'live' : ''}`} />
          {streaming ? 'Streaming' : 'Paired'}
        </span>
      </div>

      <div className="watch-shell">
        <div className="channel-card" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Paired to</p>
          <h1 style={{ fontSize: '1.3rem', marginTop: '4px' }}>{connected.patient || 'Patient'}</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
            Queue code {connected.queueId || '—'}
          </p>

          <div className="watch-face">
            <span className="scenario-tag">{SCENARIOS[scenario].label} profile</span>
            {reading ? (
              <>
                <div className="hr-reading">
                  <span className="pulse-icon" style={{ animationDuration: beatDuration }}>♥</span>
                  <span className="hr-num">{reading.heartRate}</span>
                  <span className="hr-unit">bpm</span>
                </div>
                <div style={{ color: 'var(--on-dark-soft)', fontSize: '0.85rem', marginTop: '6px' }}>
                  SpO2 {reading.spo2}%
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--on-dark-soft)', fontSize: '0.9rem', padding: '0 30px' }}>
                Press start to begin streaming
              </p>
            )}
          </div>

          {reading && (
            <div className="vitals-row four">
              <div className="vital-tile">
                <div className="v-label">Resp. rate</div>
                <div className="v-value">{reading.respRate} <small>/min</small></div>
              </div>
              <div className="vital-tile">
                <div className="v-label">Temperature</div>
                <div className="v-value">{reading.tempF}°<small>F</small></div>
              </div>
              <div className="vital-tile">
                <div className="v-label">Blood pressure</div>
                <div className="v-value">{reading.systolicBP}/{reading.diastolicBP}</div>
              </div>
              <div className="vital-tile">
                <div className="v-label">SpO2</div>
                <div className="v-value">{reading.spo2}<small>%</small></div>
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '18px', marginBottom: '8px', textAlign: 'left' }}>
            Simulated condition
          </p>
          <div className="scenario-row">
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button
                key={key}
                type="button"
                className={key === 'critical' ? 'critical' : ''}
                aria-pressed={scenario === key}
                onClick={() => setScenario(key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: '20px' }}
            onClick={toggleStreaming}
          >
            {streaming ? 'Stop streaming' : 'Start streaming'}
          </button>
          <button className="btn-ghost" onClick={disconnect}>
            Unpair device
          </button>

          {log.length > 0 && (
            <div className="stream-log" style={{ textAlign: 'left' }}>
              {log.map((entry, i) => (
                <div className={`log-row ${entry.ok ? 'ok' : 'fail'}`} key={i}>
                  <span>{entry.time.toLocaleTimeString()}</span>
                  <span>{entry.ok ? `Sent · ${entry.hr} bpm` : 'Send failed'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
