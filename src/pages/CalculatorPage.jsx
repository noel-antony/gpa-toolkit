import { useCallback, useEffect, useMemo, useState } from 'react'
import GradeBarChart from '../components/GradeBarChart'
import GradeTooltip from '../components/GradeTooltip'
import StatCard from '../components/StatCard'
import SubjectTable from '../components/SubjectTable'
import TinySnackbar from '../components/TinySnackbar'
import {
  applySubjectPatch,
  calculateCgpa,
  calculateSgpa,
  createDefaultSubjects,
  createSubject,
  getSubjectMetrics,
} from '../utils/gpa'
import { clearAppState } from '../utils/storage'

const SNACKBAR_TIMEOUT_MS = 4200

function buildDefaultState() {
  return {
    previousCgpa: '',
    semesterNumber: 1,
    subjects: createDefaultSubjects(),
  }
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value))
}

function CalculatorPage({ appState, updateState }) {
  const { subjects, previousCgpa, semesterNumber } = appState
  const [sortMode, setSortMode] = useState('manual')
  const [snackbar, setSnackbar] = useState(null)

  useEffect(() => {
    if (!snackbar) return undefined

    const timeoutId = setTimeout(() => {
      setSnackbar(null)
    }, SNACKBAR_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [snackbar])

  const showSnackbar = useCallback((message, undoPayload = null) => {
    setSnackbar({
      id: Date.now(),
      message,
      undoPayload,
    })
  }, [])

  const metrics = useMemo(
    () => subjects.map((subject) => ({ ...subject, metrics: getSubjectMetrics(subject) })),
    [subjects],
  )

  const metricById = useMemo(
    () => new Map(metrics.map((item) => [item.id, item.metrics])),
    [metrics],
  )

  const sortedSubjects = useMemo(() => {
    const list = [...subjects]

    if (sortMode === 'performance-desc') {
      return list.sort(
        (a, b) =>
          (metricById.get(b.id)?.percentage ?? 0) - (metricById.get(a.id)?.percentage ?? 0),
      )
    }

    if (sortMode === 'risk-first') {
      return list.sort(
        (a, b) => (metricById.get(a.id)?.point ?? 0) - (metricById.get(b.id)?.point ?? 0),
      )
    }

    if (sortMode === 'credits-desc') {
      return list.sort((a, b) => Number(b.credits || 0) - Number(a.credits || 0))
    }

    return list
  }, [subjects, sortMode, metricById])

  const sgpa = useMemo(() => calculateSgpa(subjects), [subjects])
  const cgpa = useMemo(
    () => calculateCgpa(previousCgpa, semesterNumber, sgpa),
    [previousCgpa, semesterNumber, sgpa],
  )

  const topPerformer = useMemo(() => {
    if (!metrics.length) return null
    return metrics.reduce((best, current) =>
      current.metrics.percentage > best.metrics.percentage ? current : best,
    )
  }, [metrics])

  const focusSubject = useMemo(() => {
    if (!metrics.length) return null
    return metrics.reduce((worst, current) =>
      current.metrics.percentage < worst.metrics.percentage ? current : worst,
    )
  }, [metrics])

  const totalCredits = useMemo(
    () => metrics.reduce((sum, item) => sum + Number(item.credits || 0), 0),
    [metrics],
  )

  const atRiskCount = useMemo(
    () => metrics.filter((item) => item.metrics.point < 6.5).length,
    [metrics],
  )

  const passRate = useMemo(() => {
    if (!metrics.length) return 0
    const passed = metrics.filter((item) => item.metrics.point >= 5.5).length
    return (passed / metrics.length) * 100
  }, [metrics])

  const chartData = useMemo(
    () =>
      sortedSubjects.map((subject) => {
        const subjectMetrics = metricById.get(subject.id) ?? getSubjectMetrics(subject)
        const totalMarks = Math.min(
          150,
          Math.max(0, Number(subject.internal || 0) + Number(subject.external || 0)),
        )

        return {
          id: subject.id,
          name: subject.name,
          totalMarks,
          point: subjectMetrics.point,
          percentage: subjectMetrics.percentage,
          grade: subjectMetrics.grade,
          internalRaw: Number(subject.internal || 0),
          externalRaw: Number(subject.external || 0),
        }
      }),
    [sortedSubjects, metricById],
  )

  const addSubject = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        createSubject(Math.max(0, ...prev.subjects.map((subject) => subject.id)) + 1),
      ],
    }))
  }, [updateState])

  const updateSubject = useCallback(
    (id, patch) => {
      updateState((prev) => ({
        ...prev,
        subjects: prev.subjects.map((subject) =>
          subject.id === id ? applySubjectPatch(subject, patch) : subject,
        ),
      }))
    },
    [updateState],
  )

  const deleteSubject = useCallback(
    (id) => {
      updateState((prev) => ({
        ...prev,
        subjects: (() => {
          const index = prev.subjects.findIndex((subject) => subject.id === id)
          if (index === -1) return prev.subjects

          const removedSubject = prev.subjects[index]
          showSnackbar(`${removedSubject.name || 'Subject'} deleted`, {
            type: 'delete',
            index,
            subject: cloneState(removedSubject),
          })

          return prev.subjects.filter((subject) => subject.id !== id)
        })(),
      }))
    },
    [showSnackbar, updateState],
  )

  const resetAll = useCallback(() => {
    updateState((prev) => {
      const backup = cloneState(prev)
      clearAppState()
      showSnackbar('All data reset', {
        type: 'reset',
        state: backup,
      })

      return buildDefaultState()
    })
  }, [showSnackbar, updateState])

  const undoSnackbarAction = useCallback(() => {
    if (!snackbar?.undoPayload) return

    const payload = snackbar.undoPayload

    if (payload.type === 'delete') {
      updateState((prev) => {
        const nextSubjects = [...prev.subjects]
        const insertAt = Math.max(0, Math.min(payload.index, nextSubjects.length))
        nextSubjects.splice(insertAt, 0, payload.subject)
        return {
          ...prev,
          subjects: nextSubjects,
        }
      })
    }

    if (payload.type === 'reset') {
      updateState(() => payload.state)
    }

    setSnackbar(null)
  }, [snackbar, updateState])

  const exportSummary = useCallback(() => {
    const now = new Date()
    const lines = [
      'GPA Flow Summary',
      `Generated: ${now.toLocaleString()}`,
      `SGPA: ${sgpa.toFixed(2)}`,
      `Estimated CGPA: ${cgpa.toFixed(2)}`,
      `Previous CGPA Input: ${previousCgpa || 'N/A'}`,
      `Semester Number: ${semesterNumber}`,
      '',
      'Subjects',
    ]

    sortedSubjects.forEach((subject, index) => {
      const subjectMetrics = metricById.get(subject.id) ?? getSubjectMetrics(subject)
      const totalMarks = Number(subject.internal || 0) + Number(subject.external || 0)

      lines.push(
        `${index + 1}. ${subject.name} | Cr ${subject.credits} | Int ${subject.internal}/50 | Ext ${subject.external}/100 | Total ${totalMarks.toFixed(1)}/150 | Grade ${subjectMetrics.grade} | GP ${subjectMetrics.point.toFixed(2)}`,
      )
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const fileUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = fileUrl
    anchor.download = `gpa-summary-${now.toISOString().slice(0, 10)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(fileUrl)

    showSnackbar('Summary exported')
  }, [cgpa, metricById, previousCgpa, semesterNumber, sgpa, showSnackbar, sortedSubjects])

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border-[0.5px] border-teal-400/35 bg-gradient-to-br from-slate-900/90 via-slate-900/86 to-teal-900/18 p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">Subjects</h2>
            <div className="flex items-center gap-2">
              <GradeTooltip />
            </div>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Edit marks or choose a grade. Selecting a grade automatically tunes external marks.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addSubject}
              className="rounded-lg bg-teal-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
            >
              Add Subject
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/20"
            >
              Reset All
            </button>

            <button
              type="button"
              onClick={exportSummary}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
            >
              Export Summary
            </button>

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              Sort by
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-200 transition focus:border-teal-400 focus:outline-none"
              >
                <option value="manual">Default</option>
                <option value="performance-desc">Highest</option>
                <option value="risk-first">Lowest</option>
                <option value="credits-desc">Credits</option>
              </select>
            </label>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-emerald-500/25 bg-gradient-to-br from-slate-950/90 to-emerald-950/25 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Top performing</p>
              <p className="text-sm font-semibold text-emerald-300">
                {topPerformer ? `${topPerformer.name} (${topPerformer.metrics.grade})` : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/25 bg-gradient-to-br from-slate-950/90 to-amber-950/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Needs attention</p>
              <p className="text-sm font-semibold text-amber-300">
                {focusSubject ? `${focusSubject.name} (${focusSubject.metrics.grade})` : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg border border-yellow-500/25 bg-gradient-to-br from-slate-950/90 to-yellow-950/15 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">At Risk ({`<`}6.5)</p>
              <p className="text-sm font-semibold text-yellow-200">{atRiskCount} subjects</p>
            </div>
            <div className="rounded-lg border border-cyan-500/25 bg-gradient-to-br from-slate-950/90 to-cyan-950/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Load / Pass Rate</p>
              <p className="text-sm font-semibold text-cyan-200">
                {totalCredits.toFixed(1)} credits | {passRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div key={sgpa.toFixed(4)} className="animate-pop">
            <StatCard label="SGPA" value={sgpa.toFixed(2)} emphasis variant="sgpa" />
          </div>
          <StatCard label="CGPA (Estimated)" value={cgpa.toFixed(2)} variant="cgpa" />
        </div>
      </div>

      <div className="rounded-2xl border-[0.5px] border-teal-400/35 bg-gradient-to-br from-slate-900/88 via-slate-900/84 to-teal-900/20 p-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            Previous CGPA
            <input
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={previousCgpa}
              onChange={(event) => updateState({ previousCgpa: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-sm text-slate-300">
            Current Semester Number
            <input
              type="number"
              min="1"
              value={semesterNumber}
              onChange={(event) => updateState({ semesterNumber: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <SubjectTable
          subjects={sortedSubjects}
          onUpdateSubject={updateSubject}
          onDeleteSubject={deleteSubject}
        />
      </div>

      <GradeBarChart chartData={chartData} />

      <TinySnackbar
        open={Boolean(snackbar)}
        message={snackbar?.message ?? ''}
        actionLabel={snackbar?.undoPayload ? 'Undo' : null}
        onAction={snackbar?.undoPayload ? undoSnackbarAction : null}
        onClose={() => setSnackbar(null)}
      />
    </section>
  )
}

export default CalculatorPage
