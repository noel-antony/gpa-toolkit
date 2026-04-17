export const GRADE_TO_POINTS = {
  S: 10,
  'A+': 9,
  A: 8.5,
  'B+': 8,
  B: 7.5,
  'C+': 7,
  C: 6.5,
  D: 6,
  P: 5.5,
  F: 0,
}

export const GRADE_OPTIONS = Object.keys(GRADE_TO_POINTS)

export const GRADE_BANDS = [
  { grade: 'S', min: 90, max: 100, target: 95 },
  { grade: 'A+', min: 85, max: 89.99, target: 87 },
  { grade: 'A', min: 80, max: 84.99, target: 82 },
  { grade: 'B+', min: 75, max: 79.99, target: 77 },
  { grade: 'B', min: 70, max: 74.99, target: 72 },
  { grade: 'C+', min: 65, max: 69.99, target: 67 },
  { grade: 'C', min: 60, max: 64.99, target: 62 },
  { grade: 'D', min: 55, max: 59.99, target: 57 },
  { grade: 'P', min: 50, max: 54.99, target: 52 },
  { grade: 'F', min: 0, max: 49.99, target: 45 },
]

export function clampNumber(value, min, max) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function marksToPercentage(internal = 0, external = 0) {
  const boundedInternal = clampNumber(Number(internal) || 0, 0, 50)
  const boundedExternal = clampNumber(Number(external) || 0, 0, 100)
  return ((boundedInternal + boundedExternal) / 150) * 100
}

export function percentageToGrade(percentage) {
  const bounded = clampNumber(Number(percentage) || 0, 0, 100)
  return GRADE_BANDS.find((band) => bounded >= band.min)?.grade ?? 'F'
}

export function percentageToPoint(percentage) {
  const grade = percentageToGrade(percentage)
  return GRADE_TO_POINTS[grade]
}

export function gradeToPoint(grade) {
  return GRADE_TO_POINTS[grade] ?? 0
}

export function gradeToTargetPercentage(grade) {
  return GRADE_BANDS.find((band) => band.grade === grade)?.target ?? 45
}

export function pointToClosestGrade(point) {
  if (point >= 10) return 'S'
  if (point <= 0) return 'F'

  const sorted = Object.entries(GRADE_TO_POINTS).sort((a, b) => b[1] - a[1])
  return sorted.find(([, gradePoint]) => point >= gradePoint)?.[0] ?? 'F'
}

export function pointToDifficulty(pointNeeded) {
  if (pointNeeded > 10) return { label: 'Impossible', color: 'text-rose-400' }
  if (pointNeeded >= 9) return { label: 'Very Hard', color: 'text-rose-300' }
  if (pointNeeded >= 8) return { label: 'Hard', color: 'text-amber-300' }
  if (pointNeeded >= 7) return { label: 'Moderate', color: 'text-emerald-300' }
  return { label: 'Comfortable', color: 'text-teal-300' }
}

const GRADE_THEME = {
  S: {
    text: 'text-emerald-200',
    badge:
      'border-emerald-300/60 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(34,197,94,0.38)]',
    border: 'border-emerald-400/70 shadow-[0_0_20px_rgba(34,197,94,0.26)]',
    chart: '#22c55e',
  },
  'A+': {
    text: 'text-emerald-200',
    badge: 'border-emerald-300/45 bg-emerald-500/14 text-emerald-200',
    border: 'border-emerald-500/40',
    chart: '#4ade80',
  },
  A: {
    text: 'text-lime-200',
    badge: 'border-lime-300/45 bg-lime-500/14 text-lime-200',
    border: 'border-lime-500/40',
    chart: '#84cc16',
  },
  'B+': {
    text: 'text-yellow-200',
    badge: 'border-yellow-300/45 bg-yellow-500/14 text-yellow-200',
    border: 'border-yellow-500/40',
    chart: '#facc15',
  },
  B: {
    text: 'text-amber-200',
    badge: 'border-amber-300/45 bg-amber-500/14 text-amber-200',
    border: 'border-amber-500/40',
    chart: '#f59e0b',
  },
  'C+': {
    text: 'text-orange-200',
    badge: 'border-orange-300/45 bg-orange-500/14 text-orange-200',
    border: 'border-orange-500/40',
    chart: '#fb923c',
  },
  C: {
    text: 'text-orange-200',
    badge: 'border-orange-300/40 bg-orange-500/12 text-orange-200',
    border: 'border-orange-500/35',
    chart: '#f97316',
  },
  D: {
    text: 'text-orange-100',
    badge: 'border-orange-200/40 bg-orange-500/10 text-orange-100',
    border: 'border-orange-400/35',
    chart: '#ea580c',
  },
  P: {
    text: 'text-orange-100',
    badge: 'border-orange-200/30 bg-orange-500/8 text-orange-100',
    border: 'border-orange-300/30',
    chart: '#d97706',
  },
  F: {
    text: 'text-rose-200',
    badge: 'border-rose-300/50 bg-rose-500/16 text-rose-200',
    border: 'border-rose-500/50',
    chart: '#f43f5e',
  },
}

export function pointToTheme(point) {
  return gradeToTheme(pointToClosestGrade(point))
}

export function gradeToTheme(grade) {
  return GRADE_THEME[grade] ?? GRADE_THEME.F
}
