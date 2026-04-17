import { memo, useMemo } from 'react'
import { GRADE_OPTIONS, gradeToTheme } from '../utils/grading'
import { getSubjectMetrics } from '../utils/gpa'

function SubjectRow({ subject, onUpdate, onDelete }) {
  const metrics = useMemo(() => getSubjectMetrics(subject), [subject])
  const hasInternalError = Number(subject.internal) > 50 || Number(subject.internal) < 0
  const hasExternalError = Number(subject.external) > 100 || Number(subject.external) < 0
  const hasCreditsError = Number(subject.credits) < 0
  const theme = gradeToTheme(metrics.grade)
  const totalMarks = Math.min(150, Math.max(0, Number(subject.internal || 0) + Number(subject.external || 0)))

  return (
    <div
      className={`grid grid-cols-1 gap-2 rounded-xl border bg-slate-900/70 p-3 transition hover:bg-slate-900/90 md:grid-cols-12 md:items-center ${theme.border}`}
    >
      <input
        value={subject.name}
        onChange={(event) => onUpdate(subject.id, { name: event.target.value })}
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white transition focus:border-teal-400 focus:outline-none md:col-span-4"
        placeholder="Subject name"
      />

      <input
        type="number"
        min="0"
        max="10"
        value={subject.credits}
        onChange={(event) => onUpdate(subject.id, { credits: event.target.value })}
        className={`rounded-lg border bg-slate-950 px-3 py-2 text-sm md:col-span-1 ${
          hasCreditsError ? 'border-rose-400' : 'border-slate-700'
        } transition focus:border-teal-400 focus:outline-none`}
        placeholder="Credits"
      />

      <input
        type="number"
        min="0"
        max="50"
        value={subject.internal}
        onChange={(event) => onUpdate(subject.id, { internal: event.target.value })}
        className={`rounded-lg border bg-slate-950 px-3 py-2 text-sm md:col-span-1 ${
          hasInternalError ? 'border-rose-400' : 'border-slate-700'
        } transition focus:border-teal-400 focus:outline-none`}
        placeholder="Internal"
      />

      <input
        type="number"
        min="0"
        max="100"
        value={subject.external}
        onChange={(event) => onUpdate(subject.id, { external: event.target.value })}
        className={`rounded-lg border bg-slate-950 px-3 py-2 text-sm md:col-span-1 ${
          hasExternalError ? 'border-rose-400' : 'border-slate-700'
        } transition focus:border-teal-400 focus:outline-none`}
        placeholder="External"
      />

      <select
        value={subject.grade}
        onChange={(event) => onUpdate(subject.id, { grade: event.target.value })}
        className={`rounded-lg border bg-slate-950 px-3 py-2 text-sm transition focus:outline-none md:col-span-1 ${theme.text} ${theme.border}`}
      >
        {GRADE_OPTIONS.map((grade) => (
          <option key={grade} value={grade}>
            {grade}
          </option>
        ))}
      </select>

      <div className="rounded-lg border border-slate-700 bg-slate-950/85 px-2 py-2 text-center text-sm font-bold md:col-span-1">
        <p className={theme.text}>{metrics.point.toFixed(1)}</p>
      </div>

      <div
        className={`rounded-xl border px-3 py-2 text-center shadow-[0_0_14px_rgba(20,184,166,0.15)] md:col-span-2 ${theme.badge}`}
      >
        <p className="text-base font-black leading-tight">{metrics.grade}</p>
        <p className="text-xs">{totalMarks.toFixed(1)} / 150</p>
        <p className="text-[11px] opacity-90">{metrics.percentage.toFixed(1)}%</p>
      </div>

      <button
        type="button"
        onClick={() => onDelete(subject.id)}
        aria-label={`Delete ${subject.name}`}
        className="inline-flex h-12 w-12 items-center justify-center justify-self-end rounded-lg border border-rose-400/30 bg-rose-500/10 text-rose-200 transition hover:border-rose-300 hover:bg-rose-500/20 md:col-span-1 md:justify-self-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
        <span className="sr-only">Delete subject</span>
      </button>

      {(hasInternalError || hasExternalError || hasCreditsError) && (
        <p className="text-xs text-rose-300 md:col-span-12">
          Please keep credits {`>=`} 0, internal in 0-50 and external in 0-100.
        </p>
      )}
    </div>
  )
}

export default memo(SubjectRow)
