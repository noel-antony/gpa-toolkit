import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import CalculatorPage from './pages/CalculatorPage'
import TargetPage from './pages/TargetPage'
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
        <header className="rounded-2xl border-[0.5px] border-teal-500/25 bg-gradient-to-br from-slate-900/88 via-slate-900/84 to-teal-900/18 p-5 shadow-glow backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">GPA Flow</h1>
              <p className="text-sm text-slate-300">Real-time SGPA and CGPA with planning tools</p>
            </div>
            <nav className="flex gap-2">
              <NavLink to="/" className={navItemClass} end>
                Calculator
              </NavLink>
              <NavLink to="/target" className={navItemClass}>
                Target Planner
              </NavLink>
            </nav>
          </div>
        </header>

        {pages}
      </div>
    </div>
  )
}

export default App
