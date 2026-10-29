export default function Sparkline({ values, color }) {
  if (!values || values.length < 2) {
    return <svg viewBox="0 0 100 30" preserveAspectRatio="none" />
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100
      const y = 28 - ((v - min) / range) * 26
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}
