import { useEffect, useState } from 'react'
import api, { errorMessage } from '../services/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'

export default function Statistics() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/statistics')
        setStats(data)
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (loading) return <div className="p-8 text-sm text-slate-400">Loading statistics…</div>
  if (!stats) return null

  const categoryEntries = Object.entries(stats.itemsByCategory || {})
  const maxCategory = Math.max(1, ...categoryEntries.map(([, v]) => v))
  const maxMonth = Math.max(1, ...stats.wasteByMonth.map((m) => m.count))

  const statusData = [
    { label: 'Available', value: stats.availableItems, color: 'bg-emerald-500' },
    { label: 'Surplus', value: stats.surplusItems, color: 'bg-orange-500' },
    { label: 'Donated', value: stats.donatedItems, color: 'bg-sky-500' },
    { label: 'Expired', value: stats.expiredItems, color: 'bg-red-500' },
  ]
  const statusTotal = Math.max(1, statusData.reduce((s, d) => s + d.value, 0))

  return (
    <div className="p-8">
      <PageHeader
        title="Statistics"
        subtitle="Food saved vs wasted, category breakdown and monthly trends"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total items" value={stats.totalItems} accent="slate" />
        <StatCard
          label="Food saved"
          value={stats.donatedItems}
          accent="emerald"
          hint="Items donated to recipients"
        />
        <StatCard
          label="Food wasted"
          value={stats.expiredItems}
          accent="red"
          hint={`${stats.totalWasteLogs} waste log(s), ${stats.totalWastedQuantity} qty`}
        />
        <StatCard
          label="Expiring ≤3 days"
          value={stats.expiringIn3Days}
          accent="orange"
          hint="At risk right now"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Status distribution */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Food status distribution
          </h3>
          <div className="flex h-4 rounded-full overflow-hidden mb-4">
            {statusData.map((d) => (
              <div
                key={d.label}
                className={d.color}
                style={{ width: `${(d.value / statusTotal) * 100}%` }}
                title={`${d.label}: ${d.value}`}
              />
            ))}
          </div>
          <ul className="space-y-2">
            {statusData.map((d) => (
              <li key={d.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${d.color}`} />
                  {d.label}
                </span>
                <span className="font-medium text-slate-800">{d.value}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-semibold text-slate-800">{stats.totalMatches}</div>
              <div className="text-[11px] text-slate-500">matches</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800">
                {stats.completedPickups}/{stats.totalPickups}
              </div>
              <div className="text-[11px] text-slate-500">pickups done</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800">
                {stats.totalWastedQuantity}
              </div>
              <div className="text-[11px] text-slate-500">qty wasted</div>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Items by category
          </h3>
          {categoryEntries.length === 0 ? (
            <p className="text-sm text-slate-400">No items yet.</p>
          ) : (
            <ul className="space-y-3">
              {categoryEntries.map(([category, count]) => (
                <li key={category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">{category}</span>
                    <span className="font-medium text-slate-800">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(count / maxCategory) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Monthly waste trend */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Waste logs per month (last 6 months)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Lower is better — this shows how much food was logged as wasted.
        </p>
        <div className="flex items-end gap-3 h-44">
          {stats.wasteByMonth.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs font-medium text-slate-600">{m.count}</span>
              <div
                className="w-full rounded-t bg-red-500/80 hover:bg-red-500 transition"
                style={{ height: `${Math.max(4, (m.count / maxMonth) * 100)}%` }}
                title={`${m.month}: ${m.count}`}
              />
              <span className="text-[11px] text-slate-500">{m.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
