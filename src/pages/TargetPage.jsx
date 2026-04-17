import { useCallback, useMemo, useState } from 'react'
import StatCard from '../components/StatCard'
import {
  applySubjectPatch,
  calculateSgpa,
  externalForGrade,
  getSubjectMetrics,
  normalizeSubject,
} from '../utils/gpa'
import { clampNumber, pointToClosestGrade, gradeToTheme } from '../utils/grading'

function normalizePlannerSubjects(subjects) {
  return subjects.map((subject, index) =>
    normalizeSubject({
      ...subject,
      id: Number(subject.id) || index + 1,
    }),
  )
}

function pointBounds(subject) {
  const internal = clampNumber(Number(subject.internal) || 0, 0, 50)
  return {
    minPoint: internal / 15,
    maxPoint: (internal + 100) / 15,
  }
}

function currentPoint(subject) {
  const internal = clampNumber(Number(subject.internal) || 0, 0, 50)
  const external = clampNumber(Number(subject.external) || 0, 0, 100)
  return clampNumber((internal + external) / 15, 0, 10)
}

function rebalanceSubjects(subjects, targetSgpa, fixedIds = new Set()) {
  const normalized = normalizePlannerSubjects(subjects)
  const totalCredits = normalized.reduce((sum, subject) => sum + Number(subject.credits || 0), 0)
  if (!totalCredits) return normalized

  const targetWeighted = targetSgpa * totalCredits
  const assignedPoints = new Map()

  let fixedWeighted = 0
  let adjustable = []

  normalized.forEach((subject) => {
    const credits = Number(subject.credits || 0)
    if (!credits) {
      assignedPoints.set(subject.id, currentPoint(subject))
      return
    }

    if (fixedIds.has(subject.id)) {
      const fixedPoint = currentPoint(subject)
      assignedPoints.set(subject.id, fixedPoint)
      fixedWeighted += credits * fixedPoint
      return
    }

    const bounds = pointBounds(subject)
    adjustable.push({
      subject,
      credits,
      ...bounds,
    })
  })

  let remainingTarget = targetWeighted - fixedWeighted

  while (adjustable.length) {
    const remainingCredits = adjustable.reduce((sum, item) => sum + item.credits, 0)
    if (!remainingCredits) break

    const candidatePoint = remainingTarget / remainingCredits
    const clampedIds = new Set()

    adjustable.forEach((item) => {
      if (candidatePoint < item.minPoint) {
        assignedPoints.set(item.subject.id, item.minPoint)
        remainingTarget -= item.credits * item.minPoint
        clampedIds.add(item.subject.id)
        return
      }

      if (candidatePoint > item.maxPoint) {
        assignedPoints.set(item.subject.id, item.maxPoint)
        remainingTarget -= item.credits * item.maxPoint
        clampedIds.add(item.subject.id)
      }
    })

    if (!clampedIds.size) {
      adjustable.forEach((item) => {
        assignedPoints.set(item.subject.id, candidatePoint)
      })
      break
    }

    adjustable = adjustable.filter((item) => !clampedIds.has(item.subject.id))
  }

  return normalized.map((subject) => {
    const point = assignedPoints.has(subject.id)
      ? assignedPoints.get(subject.id)
      : currentPoint(subject)

    const internal = clampNumber(Number(subject.internal) || 0, 0, 50)
    const nextExternal = clampNumber(Number((point * 15 - internal).toFixed(1)), 0, 100)
    return applySubjectPatch(subject, { external: nextExternal })
  })
}

function buildRequirementRows(subjects, targetSgpa) {
  const normalized = normalizePlannerSubjects(subjects)
  const evaluated = normalized.map((subject) => {
    const metrics = getSubjectMetrics(subject)
    const credits = Number(subject.credits || 0)
    return { ...subject, metrics, credits }
  })

  const totalCredits = evaluated.reduce((sum, subject) => sum + subject.credits, 0)
  const currentWeighted = evaluated.reduce(
    (sum, subject) => sum + subject.metrics.point * subject.credits,
    0,
  )
  const targetWeighted = targetSgpa * totalCredits

  return evaluated.map((subject) => {
    const thisWeighted = subject.metrics.point * subject.credits
    const weightedWithoutThis = currentWeighted - thisWeighted
    const requiredPoint = subject.credits
      ? (targetWeighted - weightedWithoutThis) / subject.credits
      : 0

    const rawRequiredExternal = requiredPoint * 15 - Number(subject.internal || 0)
    const requiredExternal = clampNumber(rawRequiredExternal, 0, 100)

    return {
      ...subject,
      requiredPoint,
      requiredExternal,
      requiredPercentage: clampNumber(requiredPoint * 10, 0, 100),
      requiredGrade: pointToClosestGrade(clampNumber(requiredPoint, 0, 10)),
      impossible: rawRequiredExternal > 100,
    }
  })
}

function getAchievabilityBand(targetSgpa, projectedSgpa, impossibleCount) {
  const gap = targetSgpa - projectedSgpa

  if (impossibleCount > 0) {
    return {
      label: 'Beyond Current Constraints',
      detail: 'One or more subjects need more than 100 external marks to hit this target.',
      classes: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
    }
  }

  if (gap <= -0.4) {
    return {
      label: 'Far Above Target',
      detail: 'You are comfortably over target. You can absorb a few lower scores.',
      classes: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    }
  }

  if (gap <= -0.1) {
    return {
      label: 'Safely Ahead',
      detail: 'Current plan is above target with a healthy margin.',
      classes: 'border-teal-500/40 bg-teal-500/10 text-teal-200',
    }
  }

  if (gap <= 0.1) {
    return {
      label: 'On Track',
      detail: 'You are in the target range. Keep consistency across subjects.',
      classes: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
    }
  }

  if (gap <= 0.35) {
    return {
      label: 'Reachable Stretch',
      detail: 'Needs focused improvement in a few subjects, but still realistic.',
      classes: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
    }
  }

  if (gap <= 0.7) {
    return {
      label: 'Hard Push Needed',
      detail: 'Target requires major score gains and disciplined execution.',
      classes: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
    }
  }

  return {
    label: 'Very Unlikely',
    detail: 'Gap is large with current marks profile. Consider lowering the target.',
    classes: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
  }
}

function TargetPage({ appState, updateState }) {
  const { subjects, previousCgpa = '', semesterNumber = 1 } = appState

  const [targetMode, setTargetMode] = useState('SGPA')
  const [targetValue, setTargetValue] = useState(8.5)
  const [manualInternals, setManualInternals] = useState({})
  const [manualExternals, setManualExternals] = useState({})
  const [lockedSubjects, setLockedSubjects] = useState({})

  const semNum = Math.max(1, Number(semesterNumber) || 1)
  const prevCgpa = Number(previousCgpa) || 0

  const targetSgpa = useMemo(() => {
    if (targetMode === 'CGPA') {
      const requiredSgpa = (targetValue * semNum) - (prevCgpa * (semNum - 1))
      return clampNumber(requiredSgpa, 0, 10)
    }
    return clampNumber(targetValue, 0, 10)
  }, [targetMode, targetValue, semNum, prevCgpa])

  const targetCgpaDisplay = useMemo(() => {
    if (targetMode === 'CGPA') return targetValue
    if (semNum === 1) return targetValue
    return ((prevCgpa * (semNum - 1)) + targetSgpa) / semNum
  }, [targetMode, targetValue, targetSgpa, semNum, prevCgpa])

  const plannerSubjects = useMemo(() => {
    const seeded = normalizePlannerSubjects(subjects).map((subject) =>
      applySubjectPatch(subject, {
        internal: manualInternals[subject.id] ?? subject.internal,
        external: manualExternals[subject.id] ?? subject.external,
      }),
    )

    const fixedIds = new Set(
      Object.entries(lockedSubjects)
        .filter(([, locked]) => locked)
        .map(([id]) => Number(id)),
    )

    Object.keys(manualExternals).forEach((id) => {
      fixedIds.add(Number(id))
    })

    return rebalanceSubjects(seeded, targetSgpa, fixedIds)
  }, [subjects, manualInternals, manualExternals, lockedSubjects, targetSgpa])

  const projectedSgpa = useMemo(() => calculateSgpa(plannerSubjects), [plannerSubjects])

  const planningRows = useMemo(
    () => buildRequirementRows(plannerSubjects, targetSgpa),
    [plannerSubjects, targetSgpa],
  )

  const limitingSubjects = useMemo(
    () => planningRows.filter((row) => row.impossible),
    [planningRows],
  )

  const achievability = useMemo(
    () => getAchievabilityBand(targetSgpa, projectedSgpa, limitingSubjects.length),
    [targetSgpa, projectedSgpa, limitingSubjects.length],
  )

  const onTargetChange = useCallback((value) => {
    setTargetValue(clampNumber(Number(value) || 0, 0, 10))
  }, [])

  const onInternalChange = useCallback((id, value) => {
    setManualInternals((current) => ({
      ...current,
      [id]: clampNumber(Number(value) || 0, 0, 50),
    }))
  }, [])

  const onExternalChange = useCallback((id, value) => {
    if (lockedSubjects[id]) return

    setManualExternals((current) => ({
      ...current,
      [id]: clampNumber(Number(value) || 0, 0, 100),
    }))
  }, [lockedSubjects])

  const onGradeChange = useCallback(
    (id, grade, internal) => {
      if (lockedSubjects[id]) return
      const ext = externalForGrade(grade, internal)
      onExternalChange(id, ext)
    },
    [lockedSubjects, onExternalChange],
  )

  const stepExternal = useCallback(
    (id, delta, currentExternal) => {
      onExternalChange(id, Number(currentExternal || 0) + delta)
    },
    [onExternalChange],
  )

  const toggleLock = useCallback((id, currentExternal) => {
    const normalizedExternal = clampNumber(Number(currentExternal) || 0, 0, 100)

    setLockedSubjects((current) => {
      const nextLocked = !current[id]

      setManualExternals((manualCurrent) => {
        if (nextLocked) {
          return {
            ...manualCurrent,
            [id]: normalizedExternal,
          }
        }

        const nextManual = { ...manualCurrent }
        delete nextManual[id]
        return nextManual
      })

      return {
        ...current,
        [id]: nextLocked,
      }
    })
  }, [])

  const resetPlanner = useCallback(() => {
    setManualInternals({})
    setManualExternals({})
    setLockedSubjects({})
  }, [])

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-teal-500/50 bg-gradient-to-br from-slate-900/90 via-slate-900/86 to-teal-900/18 p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">Target Planner</h2>
            <div className="flex items-center gap-1 rounded-lg border border-teal-500/30 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => setTargetMode('SGPA')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition ${targetMode === 'SGPA' ? 'bg-teal-500 text-teal-950' : 'text-slate-400 hover:text-white'}`}
              >
                SGPA
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('CGPA')}
                className={`rounded px-3 py-1.5 text-xs font-bold transition ${targetMode === 'CGPA' ? 'bg-teal-500 text-teal-950' : 'text-slate-400 hover:text-white'}`}
              >
                CGPA
              </button>
            </div>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Set your target {targetMode}, adjust marks, and the planner will automatically balance the rest.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <span className="shrink-0 whitespace-nowrap font-medium text-teal-100">
                Target {targetMode}
              </span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={targetValue}
                onChange={(event) => onTargetChange(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-teal-500/30 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              />
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="5"
                max="10"
                step="0.1"
                value={targetValue}
                onChange={(event) => onTargetChange(event.target.value)}
                className="w-full accent-teal-500"
              />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
            <label className={`text-sm ${targetMode === 'SGPA' ? 'text-slate-500' : 'text-slate-300'}`}>
              Previous CGPA
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={previousCgpa}
                onChange={(event) => updateState({ previousCgpa: event.target.value })}
                disabled={targetMode === 'SGPA'}
                className="mt-1 w-full rounded-lg border border-teal-500/30 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
            <label className={`text-sm ${targetMode === 'SGPA' ? 'text-slate-500' : 'text-slate-300'}`}>
              Current Semester Number
              <input
                type="number"
                min="1"
                value={semesterNumber}
                onChange={(event) => updateState({ semesterNumber: event.target.value })}
                disabled={targetMode === 'SGPA'}
                className="mt-1 w-full rounded-lg border border-teal-500/30 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <StatCard label="Target SGPA" value={targetSgpa.toFixed(2)} emphasis={targetMode === 'SGPA'} variant="sgpa" />
          <StatCard label="Target CGPA" value={targetCgpaDisplay.toFixed(2)} emphasis={targetMode === 'CGPA'} variant="cgpa" />
        </div>
      </div>

      <div className="rounded-2xl border border-teal-500/50 bg-gradient-to-br from-slate-900/88 via-slate-900/84 to-teal-900/16 p-4 md:p-6">
        <div 
          className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-500/20 pb-4" 
        >
          <h2 className="text-xl font-bold text-teal-100">Per-subject controls</h2>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={resetPlanner}
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-bold tracking-wide text-slate-200 transition hover:bg-slate-700"
            >
              RESET
            </button>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4 pt-4">
          <div 
            className="hidden md:grid md:items-center gap-4 px-4 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400"
            style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(80px, 0.7fr) minmax(240px, 2fr) minmax(130px, 1fr) 44px' }}
          >
            <div>Subject</div>
            <div className="text-center">Internal</div>
            <div className="text-center">External required</div>
            <div className="text-center">Grade</div>
            <div className="text-center">Lock</div>
          </div>
          {plannerSubjects.map((subject) => {
            const metrics = getSubjectMetrics(subject)
            const isLocked = Boolean(lockedSubjects[subject.id])
            const theme = gradeToTheme(metrics.grade)
            const borderColor = theme.border.split(' ')[0]

            return (
              <div
                key={subject.id}
                className={`flex flex-col md:grid md:items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl border bg-slate-900/70 p-3 md:p-4 transition hover:bg-slate-900/90 ${theme.border}`}
                style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(80px, 0.7fr) minmax(240px, 2fr) minmax(130px, 1fr) 44px' }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{subject.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Credits: {subject.credits}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="md:hidden text-xs text-slate-400 w-16">Internal:</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={subject.internal}
                    onChange={(event) => onInternalChange(subject.id, event.target.value)}
                    disabled={isLocked}
                    className={`w-full md:w-full rounded-md md:rounded-xl border bg-slate-950 px-2 py-1.5 md:py-2 text-sm text-center text-white focus:outline-none transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] ${borderColor} disabled:opacity-40`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="md:hidden text-xs text-slate-400 w-16">External:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={subject.external}
                      onChange={(event) => onExternalChange(subject.id, event.target.value)}
                      disabled={isLocked}
                      className={`w-16 md:w-[72px] shrink-0 rounded-md md:rounded-xl border bg-slate-950 px-2 py-1.5 md:py-2 text-sm text-center text-white focus:outline-none disabled:opacity-40 transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] ${borderColor}`}
                    />
                    <div className="flex flex-1 items-center gap-1.5 md:gap-2">
                      <button
                        type="button"
                        onClick={() => stepExternal(subject.id, -1, subject.external)}
                        disabled={isLocked || Number(subject.external) <= 0}
                        className={`flex h-6 w-8 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-md border bg-slate-800 hover:bg-slate-700 disabled:opacity-35 transition ${borderColor} ${theme.text}`}
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={subject.external}
                        onChange={(event) => onExternalChange(subject.id, event.target.value)}
                        disabled={isLocked}
                        className={`h-1.5 w-full disabled:opacity-40`}
                        style={{ accentColor: theme.chart }}
                      />
                      <button
                        type="button"
                        onClick={() => stepExternal(subject.id, 1, subject.external)}
                        disabled={isLocked || Number(subject.external) >= 100}
                        className={`flex h-6 w-8 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-md border bg-slate-800 hover:bg-slate-700 disabled:opacity-35 transition ${borderColor} ${theme.text}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="md:hidden text-xs text-slate-400 w-16">Grade:</span>
                  <select
                    value={subject.grade}
                    onChange={(event) => onGradeChange(subject.id, event.target.value, subject.internal)}
                    disabled={isLocked}
                    className={`w-full rounded-md md:rounded-xl border bg-slate-950 px-3 py-1.5 md:py-2 text-base font-semibold text-center focus:outline-none disabled:opacity-45 transition shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] cursor-pointer ${borderColor} ${theme.text}`}
                  >
                    {['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'P', 'F'].map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end md:justify-center">
                  <button
                    type="button"
                    onClick={() => toggleLock(subject.id, subject.external)}
                    className={`flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-md md:rounded-xl border transition ${
                      isLocked
                        ? `bg-slate-800/80 shadow-[0_0_10px_rgba(255,255,255,0.1)] ${borderColor} ${theme.text}`
                        : `bg-slate-800/40 text-slate-500 hover:text-slate-300 ${borderColor}`
                    }`}
                    title={isLocked ? 'Unlock' : 'Lock'}
                  >
                    {isLocked ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M208,88H176V56a48,48,0,0,0-96,0V88H48A16,16,0,0,0,32,104V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V104A16,16,0,0,0,208,88ZM96,56a32,32,0,0,1,64,0V88H96ZM208,208H48V104H208V208Zm-80-64a16,16,0,1,1-16-16A16,16,0,0,1,128,144Z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M208,88H128V56a32,32,0,0,0-64,0,8,8,0,0,1-16,0,48,48,0,0,1,96,0V88h64a16,16,0,0,1,16,16V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V104A16,16,0,0,1,48,88H96V104H48V208H208V104H208Z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 text-sm ${achievability.classes}`}>
        <p className="font-semibold">{achievability.label}</p>
        <p className="mt-1">{achievability.detail}</p>
        <p className="mt-2 text-xs">
          Projected SGPA: {projectedSgpa.toFixed(2)} | Target: {targetSgpa.toFixed(2)}
        </p>
        {limitingSubjects.length > 0 && (
          <p className="mt-2 text-xs">
            Limiting subjects: {limitingSubjects.map((subject) => subject.name).join(', ')}
          </p>
        )}
      </div>
    </section>
  )
}

export default TargetPage
