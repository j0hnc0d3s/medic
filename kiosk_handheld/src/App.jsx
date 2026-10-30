import { useEffect, useState } from 'react'
import LookupCode from './components/LookupCode.jsx'
import NewIntake from './components/NewIntake.jsx'
import logo from './assets/logo.png'

const IDLE_RESET_MS = 90_000

export default function App() {
  const [tab, setTab] = useState('lookup')
  const [resetKey, setResetKey] = useState(0)

  // A shared kiosk/handheld device should never sit on someone's filled-in
  // form or search results once they've stepped away — reset to the two
  // tabs after a stretch of no interaction.
  useEffect(() => {
    let timer
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        setTab('lookup')
        setResetKey((k) => k + 1)
      }, IDLE_RESET_MS)
    }
    const events = ['pointerdown', 'keydown', 'touchstart']
    events.forEach((e) => window.addEventListener(e, arm))
    arm()
    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, arm))
    }
  }, [])

  const returnToStart = () => {
    setTab('lookup')
    setResetKey((k) => k + 1)
  }

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <div className="app-brand">
          <img className="app-brand-logo" src={logo} alt="" />
          Medic
        </div>
        <span className="app-mode">Self check-in</span>
      </div>

      <div className="tabbar" role="tablist" aria-label="Check-in options">
        <button
          role="tab"
          aria-selected={tab === 'lookup'}
          onClick={() => setTab('lookup')}
        >
          Lookup Code
        </button>
        <button
          role="tab"
          aria-selected={tab === 'intake'}
          onClick={() => setTab('intake')}
        >
          New Intake
        </button>
      </div>

      <div className="card">
        {tab === 'lookup' ? (
          <LookupCode key={`lookup-${resetKey}`} onStartIntake={() => setTab('intake')} />
        ) : (
          <NewIntake key={`intake-${resetKey}`} onDone={returnToStart} />
        )}
      </div>
    </div>
  )
}
