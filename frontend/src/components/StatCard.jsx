export default function StatCard({ label, value, accent = 'slate', hint }) {
  const accents = {
    slate: 'bg-slate-700',
    emerald: 'bg-emerald-600',
    red: 'bg-red-600',
    orange: 'bg-orange-500',
    sky: 'bg-sky-600',
    violet: 'bg-violet-600',
    yellow: 'bg-yellow-500',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${accents[accent] || accents.slate}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}
