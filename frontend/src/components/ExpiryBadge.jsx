const COLORS = {
  red: 'bg-red-100 text-red-700 ring-red-200',
  orange: 'bg-orange-100 text-orange-700 ring-orange-200',
  yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
}

export function expiryLevel(days) {
  if (days < 0) return { key: 'red', label: `${Math.abs(days)}d past expiry` }
  if (days <= 1) return { key: 'red', label: days === 0 ? 'Expires today' : '1 day left' }
  if (days <= 3) return { key: 'orange', label: `${days} days left` }
  if (days <= 7) return { key: 'yellow', label: `${days} days left` }
  return { key: 'green', label: `${days} days left` }
}

export default function ExpiryBadge({ days }) {
  const level = expiryLevel(days)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${COLORS[level.key]}`}
    >
      {level.label}
    </span>
  )
}
