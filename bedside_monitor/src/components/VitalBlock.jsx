import Sparkline from './Sparkline.jsx'

export default function VitalBlock({ label, value, unit, color, history, flagged, rangeLabel }) {
  return (
    <div className={`vital-block${flagged ? ' flag' : ''}`}>
      <div className="v-head">
        <span>{label}</span>
        {flagged && <span>OUT OF RANGE</span>}
      </div>
      <div className="v-num mono" style={{ color }}>
        {value ?? '—'}
        {value != null && <span className="unit">{unit}</span>}
      </div>
      <div className="v-range">{rangeLabel}</div>
      <Sparkline values={history} color={color} />
    </div>
  )
}
