import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import CalculatorPage from './pages/CalculatorPage'
import TargetPage from './pages/TargetPage'
import HelpModal from './components/HelpModal'
import { createDefaultSubjects, normalizeSubject } from './utils/gpa'
import { loadAppState, saveAppState } from './utils/storage'

const initialState = {
  previousCgpa: '',
  semesterNumber: 1,
  subjects: createDefaultSubjects(),
}

function hydrateState(savedState) {
  if (!savedState) return initialState

  const sourceSubjects = Array.isArray(savedState.subjects) && savedState.subjects.length
    ? savedState.subjects
    : createDefaultSubjects()

  return {
    previousCgpa: savedState.previousCgpa ?? '',
    semesterNumber: savedState.semesterNumber ?? 1,
    subjects: sourceSubjects.map((subject, index) =>
      normalizeSubject({
        ...subject,
        id: Number(subject.id) || index + 1,
      }),
    ),
  }
}

function App() {
  const [appState, setAppState] = useState(() => {
    const saved = loadAppState()
    return hydrateState(saved)
  })

  const location = useLocation()
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  useEffect(() => {
    saveAppState(appState)
  }, [appState])

  const updateState = useCallback((updater) => {
    setAppState((current) =>
      typeof updater === 'function' ? updater(current) : { ...current, ...updater },
    )
  }, [])

  const navItemClass = useCallback(
    ({ isActive }) =>
      `rounded-xl px-4 py-2 text-sm font-semibold transition ${
        isActive
          ? 'bg-teal-500 text-slate-950 shadow-glow'
          : 'border border-teal-500/20 bg-slate-900/65 text-slate-200 hover:bg-slate-800/95'
      }`,
    [],
  )

  const pages = useMemo(
    () => (
      <Routes>
        <Route
          path="/"
          element={<CalculatorPage appState={appState} updateState={updateState} />}
        />
        <Route
          path="/target"
          element={<TargetPage appState={appState} updateState={updateState} />}
        />
      </Routes>
    ),
    [appState, updateState],
  )

  return (
    <div className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="relative flex flex-col gap-4 rounded-2xl border-[0.5px] border-teal-500/25 bg-gradient-to-br from-slate-900/88 via-slate-900/84 to-teal-900/18 p-5 shadow-glow backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">GPA Toolkit</h1>
              <p className="text-sm text-slate-300">Real-time SGPA and CGPA with planning tools</p>
            </div>
            {/* Mobile Help Button */}
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-slate-800/80 text-teal-300 transition-all hover:bg-teal-900/60 hover:text-white sm:hidden"
              title="Guide"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
          
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navItemClass} end>
              Calculator
            </NavLink>
            <NavLink to="/target" className={navItemClass}>
              Target Planner
            </NavLink>
            {/* Desktop Help Button */}
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="ml-2 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-slate-800/80 text-teal-300 shadow-sm transition-all hover:bg-teal-900/60 hover:text-white sm:flex"
              title="Guide"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </nav>
        </header>

        {pages}
      </div>

      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        currentPath={location.pathname} 
      />
    </div>
  )
}

export default App
