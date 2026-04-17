import {
  GRADE_OPTIONS,
  clampNumber,
  gradeToPoint,
  gradeToTargetPercentage,
  marksToPercentage,
  percentageToGrade,
} from './grading'

export function createSubject(id) {
  const internal = 40
  const external = 80
  return {
    id,
    name: `Subject ${id}`,
    credits: 3,
    internal,
    external,
    grade: percentageToGrade(marksToPercentage(internal, external)),
  }
}

export function createDefaultSubjects() {
  const curriculumSubjects = [
    { name: 'Graph Theory', credits: 4 },
    { name: 'Operating Systems', credits: 4 },
    { name: 'Formal Languages And Automata Theory', credits: 4 },
    { name: 'Database Management Systems', credits: 3 },
    { name: 'Entrepreneurship And Software Management Systems', credits: 3 },
    { name: 'Machine Learning Concepts', credits: 3 },
    { name: 'Logic System Design And Operating Systems Lab', credits: 2 },
    { name: 'Database Lab', credits: 2 },
  ]

  return curriculumSubjects.map((subject, index) => ({
    ...createSubject(index + 1),
    name: subject.name,
    credits: subject.credits,
  }))
}

export function normalizeSubject(subject) {
  return {
    ...subject,
    name: subject.name?.trim() || 'Untitled Subject',
    id: Number(subject.id) || Date.now(),
    credits: clampNumber(Number(subject.credits) || 0, 0, 10),
    internal: clampNumber(Number(subject.internal) || 0, 0, 50),
    external: clampNumber(Number(subject.external) || 0, 0, 100),
    grade: GRADE_OPTIONS.includes(subject.grade) ? subject.grade : 'F',
  }
}

export function externalForGrade(grade, internal) {
  const boundedInternal = clampNumber(Number(internal) || 0, 0, 50)
  const targetPercentage = gradeToTargetPercentage(grade)
  const requiredTotal = (targetPercentage / 100) * 150
  return clampNumber(Number((requiredTotal - boundedInternal).toFixed(1)), 0, 100)
}

export function applySubjectPatch(subject, patch) {
  const merged = normalizeSubject({ ...subject, ...patch })
  const updated = { ...merged }
  const gradeChanged = Object.prototype.hasOwnProperty.call(patch, 'grade')
  const marksChanged =
    Object.prototype.hasOwnProperty.call(patch, 'internal') ||
    Object.prototype.hasOwnProperty.call(patch, 'external')

  if (gradeChanged) {
    updated.external = externalForGrade(updated.grade, updated.internal)
  }

  if (gradeChanged || marksChanged) {
    updated.grade = percentageToGrade(marksToPercentage(updated.internal, updated.external))
  }

  return updated
}

export function getSubjectMetrics(subject) {
  const normalized = normalizeSubject(subject)
  const percentage = marksToPercentage(normalized.internal, normalized.external)
  const grade = normalized.grade
  const point = gradeToPoint(grade)

  return {
    percentage,
    grade,
    point,
    weightedPoint: point * normalized.credits,
    credits: normalized.credits,
  }
}

export function calculateSgpa(subjects) {
  const metrics = subjects.map((subject) => getSubjectMetrics(subject))
  const totalCredits = metrics.reduce((sum, item) => sum + item.credits, 0)
  const totalWeighted = metrics.reduce((sum, item) => sum + item.weightedPoint, 0)
  if (!totalCredits) return 0
  return totalWeighted / totalCredits
}

export function calculateCgpa(previousCgpa, semesterNumber, currentSgpa) {
  const prev = clampNumber(Number(previousCgpa) || 0, 0, 10)
  const sem = Math.max(1, Number(semesterNumber) || 1)
  if (sem === 1) return currentSgpa
  return ((prev * (sem - 1)) + currentSgpa) / sem
}
