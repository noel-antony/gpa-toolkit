function TinySnackbar({ open, message, actionLabel, onAction, onClose }) {
  if (!open) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 animate-pop">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-glow backdrop-blur-sm">
        <p>{message}</p>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-md border border-teal-500/40 bg-teal-500/10 px-2 py-1 font-semibold text-teal-200 transition hover:bg-teal-500/20"
          >
            {actionLabel}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-1.5 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          aria-label="Dismiss notification"
        >
          x
        </button>
      </div>
    </div>
  )
}

export default TinySnackbar