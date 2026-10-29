import { useEffect, useState } from 'react'
import api, { errorMessage } from '../services/api'
import PageHeader from '../components/PageHeader'
import { expiryLevel } from '../components/ExpiryBadge'

const LEVEL_ROW = {
  red: 'border-l-red-500 bg-red-50/50',
  orange: 'border-l-orange-500 bg-orange-50/40',
  yellow: 'border-l-yellow-400 bg-yellow-50/40',
  green: 'border-l-emerald-400',
}

const LEVEL_LABEL = {
  red: 'Critical (≤1 day)',
  orange: 'Urgent (≤3 days)',
  yellow: 'Soon (≤7 days)',
  green: 'OK',
}

export default function Expiry() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/food-items')
      const ranked = data
        .filter((i) => i.status !== 'DONATED')
        .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
      setItems(ranked)
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markSurplus = async (item) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/food-items/${item.id}`, {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate,
        locationStored: item.locationStored,
        status: 'SURPLUS',
      })
      setNotice(`"${item.name}" is now marked as surplus and visible to recipients.`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const logWaste = async (item) => {
    const reason = window.prompt(
      `Why was "${item.name}" wasted? (this logs the waste and marks it EXPIRED)`,
      'Passed expiry date',
    )
    if (!reason) return
    setError('')
    setNotice('')
    try {
      await api.post('/api/waste-log', {
        foodItemId: item.id,
        quantity: item.quantity,
        reason,
      })
      setNotice(`Waste logged for "${item.name}".`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const visible = items.filter((i) => i.daysToExpiry <= 7)
  const counts = visible.reduce((acc, i) => {
    const level = expiryLevel(i.daysToExpiry).key
    acc[level] = (acc[level] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-8">
      <PageHeader
        title="Expiry priority"
        subtitle="Food ranked by days to expiry — act on red and orange first"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {['red', 'orange', 'yellow', 'green'].map((level) => (
          <div
            key={level}
            className={`rounded-xl ring-1 ring-slate-200 bg-white p-4 border-l-4 ${
              { red: 'border-l-red-500', orange: 'border-l-orange-500', yellow: 'border-l-yellow-400', green: 'border-l-emerald-400' }[level]
            }`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {LEVEL_LABEL[level]}
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {counts[level] || 0}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 ring-1 ring-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2 ring-1 ring-emerald-200">
          {notice}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Nothing expiring in the next 7 days.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((item) => {
              const level = expiryLevel(item.daysToExpiry)
              return (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-4 px-5 py-4 border-l-4 ${LEVEL_ROW[level.key]}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.category}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          item.status === 'SURPLUS'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.quantity} {item.unit} · expires {item.expiryDate} ·{' '}
                      {item.locationStored || 'no location'} · {item.donorName}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        level.key === 'red'
                          ? 'bg-red-100 text-red-700'
                          : level.key === 'orange'
                            ? 'bg-orange-100 text-orange-700'
                            : level.key === 'yellow'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {level.label}
                    </span>

                    {item.status === 'AVAILABLE' && (
                      <button
                        onClick={() => markSurplus(item)}
                        className="text-xs font-medium rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5"
                      >
                        Mark as surplus
                      </button>
                    )}
                    {item.status !== 'EXPIRED' && (
                      <button
                        onClick={() => logWaste(item)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 underline"
                      >
                        Log waste
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
