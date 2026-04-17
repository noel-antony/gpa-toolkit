const CARD_VARIANTS = {
  default: {
    container: 'border-slate-700 bg-slate-900/75',
    label: 'text-slate-400',
    value: 'text-white',
  },
  sgpa: {
    container:
      'border-emerald-400/45 bg-gradient-to-br from-emerald-500/22 via-teal-500/14 to-slate-900 shadow-[0_0_26px_rgba(16,185,129,0.23)]',
    label: 'text-emerald-100/90',
    value: 'text-emerald-100',
  },
  cgpa: {
    container:
      'border-cyan-400/45 bg-gradient-to-br from-cyan-500/22 via-sky-500/14 to-slate-900 shadow-[0_0_26px_rgba(56,189,248,0.23)]',
    label: 'text-cyan-100/90',
    value: 'text-cyan-100',
  },
}

function StatCard({ label, value, emphasis = false, variant = 'default' }) {
  const theme = CARD_VARIANTS[variant] ?? CARD_VARIANTS.default

  return (
    <div className={`rounded-2xl border p-4 shadow-glow transition ${theme.container}`}>
      <p className={`text-xs uppercase tracking-[0.2em] ${theme.label}`}>{label}</p>
      <p className={`mt-2 font-black ${emphasis ? 'text-4xl' : 'text-2xl'} ${theme.value}`}>
        {value}
      </p>
    </div>
  )
}

export default StatCard
