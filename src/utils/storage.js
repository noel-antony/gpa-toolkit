const STORAGE_KEY = 'gpa-flow-state-v1'

export function loadAppState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAppState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors in restrictive browser contexts.
  }
}

export function clearAppState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors in restrictive browser contexts.
  }
}
