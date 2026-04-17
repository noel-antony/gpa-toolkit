const gradeInfo = [
  'S: 10 points (>=90%)',
  'A+: 9 points (85-89%)',
  'A: 8.5 points (80-84%)',
  'B+: 8 points (75-79%)',
  'B: 7.5 points (70-74%)',
  'C+: 7 points (65-69%)',
  'C: 6.5 points (60-64%)',
  'D: 6 points (55-59%)',
  'P: 5.5 points (50-54%)',
  'F: 0 points (<50%)',
]

function GradeTooltip() {
  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        aria-label="Show grading system"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-bold text-teal-300"
      >
        ?
      </button>
      <div className="pointer-events-none absolute right-0 top-9 z-30 w-60 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100">
        <p className="mb-2 font-bold text-white">Grade Mapping</p>
        <ul className="space-y-1">
          {gradeInfo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default GradeTooltip
