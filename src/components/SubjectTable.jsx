import SubjectRow from './SubjectRow'

function SubjectTable({ subjects, onUpdateSubject, onDeleteSubject }) {
  if (!subjects.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-5 text-center text-sm text-slate-300">
        No subjects yet. Add one to start calculating your GPA.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-12 gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
        <p className="col-span-4">Subject</p>
        <p className="col-span-1">Credits</p>
        <p className="col-span-1">Internal</p>
        <p className="col-span-1">External</p>
        <p className="col-span-1">Grade</p>
        <p className="col-span-1">Point</p>
        <p className="col-span-2">Result</p>
        <p className="col-span-1 text-center"></p>
      </div>

      {subjects.map((subject) => (
        <SubjectRow
          key={subject.id}
          subject={subject}
          onUpdate={onUpdateSubject}
          onDelete={onDeleteSubject}
        />
      ))}
    </div>
  )
}

export default SubjectTable
