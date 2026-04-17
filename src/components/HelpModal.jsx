import { useEffect } from 'react'

export default function HelpModal({ isOpen, onClose, currentPath }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isTarget = currentPath === '/target'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div 
        className="w-full max-w-md transform overflow-hidden rounded-2xl border border-teal-500/30 bg-slate-900 text-left align-middle shadow-2xl transition-all shadow-teal-900/40"
      >
        <div className="border-b border-teal-500/20 px-6 py-4 flex items-center justify-between bg-slate-900/50">
          <h3 className="text-lg font-bold leading-6 text-teal-50 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isTarget ? 'Guide: Target Planner' : 'Guide: Calculator'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 text-sm text-slate-300 space-y-4">
          {isTarget ? (
            <>
              <p>The Target Planner mathematically reverse-engineers exactly what external marks you need to hit a dream GPA.</p>
              <ul className="list-outside list-disc pl-5 space-y-2 text-slate-200 marker:text-teal-500/50">
                <li>
                  <strong className="text-teal-100">SGPA vs CGPA Mode:</strong> Choose if you are targeting just this semester's GPA, or your overall Cumulative GPA.
                </li>
                <li>
                  <strong className="text-teal-100">Smart Lock (🔒):</strong> Tap the lock icon on a subject if you know your exact marks for it. The planner will instantly redistribute the required scores across all unlocked subjects!
                </li>
                <li>
                  <strong className="text-teal-100">Overrides:</strong> Dragging sliders or typing specific external marks will automatically "lock" that subject for you.
                </li>
              </ul>
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-teal-200">
                <strong>Tip:</strong> Subjects glowing red and labeled "Impossible" mathematically require over 100 on their final exam.
              </div>
            </>
          ) : (
            <>
              <p>The core Calculator instantly estimates and projects your current GPA standing.</p>
              <ul className="list-outside list-disc pl-5 space-y-2 text-slate-200 marker:text-teal-500/50">
                <li>
                  <strong className="text-teal-100">Add / Remove Subjects:</strong> Configure the exact layout of your current classes below.
                </li>
                <li>
                  <strong className="text-teal-100">Input Formats:</strong> Type in precise internal (out of 50) and external marks (out of 100).
                </li>
                <li>
                  <strong className="text-teal-100">Auto-estimation:</strong> If you just select an expected Grade (e.g., 'S' or 'A+'), the external marks will automatically update to reflect the minimum needed.
                </li>
              </ul>
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-teal-200">
                <strong>Memory:</strong> Everything you enter is automatically saved to your browser so you won't lose your data!
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-900 border-t border-teal-500/20 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-teal-600 hover:bg-teal-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition-all focus:outline-none"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}