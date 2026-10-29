// Realistic-looking vitals generation: each tick nudges the previous value
// by a small random step rather than jumping to a fresh random number, so
// a live readout drifts the way an actual sensor does instead of flickering.

export const SCENARIOS = {
  normal: {
    label: 'Normal',
    ranges: {
      heartRate: [60, 90],
      spo2: [96, 99],
      respRate: [12, 18],
      tempF: [97.3, 99.1],
      systolicBP: [108, 128],
      diastolicBP: [68, 82],
    },
  },
  elevated: {
    label: 'Elevated',
    ranges: {
      heartRate: [96, 118],
      spo2: [91, 96],
      respRate: [20, 26],
      tempF: [99.6, 101.8],
      systolicBP: [132, 152],
      diastolicBP: [86, 96],
    },
  },
  critical: {
    label: 'Critical',
    ranges: {
      heartRate: [122, 148],
      spo2: [80, 89],
      respRate: [28, 36],
      tempF: [101.8, 104.2],
      systolicBP: [82, 98],
      diastolicBP: [48, 58],
    },
  },
}

const STEP_FRACTION = 0.12 // max step as a fraction of the range width

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

export function seedReading(scenarioKey) {
  const { ranges } = SCENARIOS[scenarioKey]
  const reading = {}
  for (const [key, [lo, hi]] of Object.entries(ranges)) {
    reading[key] = lo + Math.random() * (hi - lo)
  }
  return reading
}

export function stepReading(prev, scenarioKey) {
  const { ranges } = SCENARIOS[scenarioKey]
  const next = {}
  for (const [key, [lo, hi]] of Object.entries(ranges)) {
    const width = hi - lo
    const maxStep = width * STEP_FRACTION
    const step = (Math.random() * 2 - 1) * maxStep
    const base = prev?.[key] ?? lo + Math.random() * width
    next[key] = clamp(base + step, lo, hi)
  }
  return next
}

export function round(reading) {
  return {
    heartRate: Math.round(reading.heartRate),
    spo2: Math.round(reading.spo2),
    respRate: Math.round(reading.respRate),
    tempF: Math.round(reading.tempF * 10) / 10,
    systolicBP: Math.round(reading.systolicBP),
    diastolicBP: Math.round(reading.diastolicBP),
  }
}
