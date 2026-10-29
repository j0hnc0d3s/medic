import { useEffect, useRef, useState } from 'react'
import { vitalsApi } from './api.js'
import VitalBlock from './components/VitalBlock.jsx'

const POLL_MS = 3000
const STALE_AFTER_MS = 15000

function inRange(v, lo, hi) {
  return v == null || (v >= lo && v <= hi)
}

export default function App() {
  const [entryId, setEntryId] = useState(() => new URLSearchParams(window.location.search).get('entry') || '')
  const [paired, setPaired] = useState(false)
  const [pairing, setPairing] = useState(false)
  const [pairError, setPairError] = useState('')

  const [patient, setPatient] = useState(null)
  const [latest, setLatest] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [history, setHistory] = useState({})
  const pollRef = useRef(null)

  const connect = async (id) => {
    const target = (id ?? entryId).trim()
    if (!target) return
    setPairing(true)
    setPairError('')
    try {
      const data = await vitalsApi.latest(target)
      setPatient({ name: data.patient, queueId: data.queueId, room: data.room })
      setPaired(true)
      setEntryId(target)
    } catch (err) {
      setPairError(err.message)
    } finally {
      setPairing(false)
    }
  }

  // Auto-connect if ?entry= was in the URL — lets a wall-mounted monitor be
  // bookmarked straight to a bed without anyone typing an id on load.
  useEffect(() => {
    if (entryId && !paired) connect(entryId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!paired) return

    const poll = async () => {
      try {
        const [latestData, historyData] = await Promise.all([
          vitalsApi.latest(entryId),
          vitalsApi.history(entryId, 30),
        ])
        setPatient({ name: latestData.patient, queueId: latestData.queueId, room: latestData.room })
        if (latestData.latest) {
          setLatest(latestData.latest)
          setLastUpdated(new Date())
        }
        const readings = historyData.readings || []
        setHistory({
          heartRate: readings.map((r) => r.heartRate).filter((v) => v != null),
          spo2: readings.map((r) => r.spo2).filter((v) => v != null),
          respRate: readings.map((r) => r.respRate).filter((v) => v != null),
          tempF: readings.map((r) => r.tempF).filter((v) => v != null),
          systolicBP: readings.map((r) => r.systolicBP).filter((v) => v != null),
        })
      } catch {
        // transient network hiccup — keep showing the last good reading
      }
    }

    poll()
    pollRef.current = setInterval(poll, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [paired, entryId])

  const unpair = () => {
    clearInterval(pollRef.current)
    setPaired(false)
    setPatient(null)
    setLatest(null)
    setHistory({})
    setEntryId('')
    window.history.replaceState({}, '', window.location.pathname)
  }

  if (!paired) {
    return (
      <div className="pair-shell">
        <div className="pair-card">
          <h1>Pair bedside monitor</h1>
          <p>Enter the patient's queue entry ID to display their live vitals from the paired wearable.</p>
          {pairError && <div className="pair-error">{pairError}</div>}
          <input
            type="text"
            placeholder="e.g. 8f3a1c2e-..."
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
            autoComplete="off"
          />
          <button onClick={() => connect()} disabled={pairing || !entryId.trim()}>
            {pairing ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    )
  }

  const stale = !lastUpdated || Date.now() - lastUpdated.getTime() > STALE_AFTER_MS

  const hrFlag = latest && !inRange(latest.heartRate, 50, 110)
  const spo2Flag = latest && !inRange(latest.spo2, 92, 100)
  const respFlag = latest && !inRange(latest.respRate, 10, 24)
  const tempFlag = latest && !inRange(latest.tempF, 96.5, 100.5)
  const bpFlag = latest && (!inRange(latest.systolicBP, 90, 145) || !inRange(latest.diastolicBP, 55, 95))

  return (
    <div className="monitor-shell">
      <div className="monitor-topbar">
        <div className="monitor-patient">
          <span className="name">{patient?.name || 'Patient'}</span>
          <span className="meta">
            Queue {patient?.queueId || '—'} · {patient?.room || 'Room not assigned'}
          </span>
        </div>
        <div className="monitor-status">
          <span className={`live-dot ${stale ? 'stale' : ''}`} />
          {stale ? 'No recent signal' : 'Live'}
          {lastUpdated && <span className="mono">{lastUpdated.toLocaleTimeString()}</span>}
        </div>
      </div>

      <div className="monitor-grid">
        <VitalBlock
          label="Heart rate"
          value={latest?.heartRate != null ? Math.round(latest.heartRate) : null}
          unit="bpm"
          color="var(--hr)"
          history={history.heartRate}
          flagged={hrFlag}
          rangeLabel="Normal 60–100 bpm"
        />
        <VitalBlock
          label="SpO2"
          value={latest?.spo2 != null ? Math.round(latest.spo2) : null}
          unit="%"
          color="var(--spo2)"
          history={history.spo2}
          flagged={spo2Flag}
          rangeLabel="Normal 95–100%"
        />
        <VitalBlock
          label="Resp. rate"
          value={latest?.respRate != null ? Math.round(latest.respRate) : null}
          unit="/min"
          color="var(--resp)"
          history={history.respRate}
          flagged={respFlag}
          rangeLabel="Normal 12–20 /min"
        />
        <VitalBlock
          label="Temperature"
          value={latest?.tempF != null ? latest.tempF.toFixed(1) : null}
          unit="°F"
          color="var(--temp)"
          history={history.tempF}
          flagged={tempFlag}
          rangeLabel="Normal 97–99.5°F"
        />
        <VitalBlock
          label="Blood pressure"
          value={
            latest?.systolicBP != null && latest?.diastolicBP != null
              ? `${Math.round(latest.systolicBP)}/${Math.round(latest.diastolicBP)}`
              : null
          }
          unit="mmHg"
          color="var(--bp)"
          history={history.systolicBP}
          flagged={bpFlag}
          rangeLabel="Normal ~120/80 mmHg"
        />
      </div>

      <div className="monitor-footer">
        <button className="unpair-link" onClick={unpair}>Unpair this monitor</button>
      </div>
    </div>
  )
}
