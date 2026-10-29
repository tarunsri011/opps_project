import { useEffect, useState } from 'react'
import api, { getUser, errorMessage } from '../services/api'
import PageHeader from '../components/PageHeader'
import ExpiryBadge from '../components/ExpiryBadge'

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-sky-100 text-sky-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default function Donations() {
  const user = getUser()
  const isAdmin = user.role === 'ADMIN'

  const [matches, setMatches] = useState([])
  const [surplus, setSurplus] = useState([])
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // matching form state (ADMIN)
  const [selectedItem, setSelectedItem] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const [matching, setMatching] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [matchesRes, surplusRes] = await Promise.all([
        api.get('/api/donations'),
        api.get('/api/food-items/surplus'),
      ])
      setMatches(matchesRes.data)
      const visibleSurplus = isAdmin
        ? surplusRes.data
        : surplusRes.data.filter((i) => i.donorId === user.id)
      setSurplus(visibleSurplus)
      if (isAdmin) {
        const { data } = await api.get('/api/recipients')
        setRecipients(data)
      }
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

  const createMatch = async (e) => {
    e.preventDefault()
    if (!selectedItem || !selectedRecipient) return
    setMatching(true)
    setError('')
    setNotice('')
    try {
      await api.post('/api/donations/match', {
        foodItemId: Number(selectedItem),
        recipientId: Number(selectedRecipient),
      })
      setNotice('Donation match created (status PENDING).')
      setSelectedItem('')
      setSelectedRecipient('')
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setMatching(false)
    }
  }

  const updateStatus = async (match, status) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/donations/${match.id}/status`, { status })
      setNotice(`Match #${match.id} is now ${status}.`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Donations"
        subtitle={
          isAdmin
            ? 'Match surplus food with recipients and track every donation'
            : user.role === 'DONOR'
              ? 'Where your surplus food went'
              : 'Available surplus and your donation matches'
        }
      />

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

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Create a donation match
          </h3>
          {surplus.length === 0 ? (
            <p className="text-sm text-slate-400">
              No surplus food available — donors need to mark items as surplus first.
            </p>
          ) : (
            <form onSubmit={createMatch} className="flex flex-col lg:flex-row gap-3">
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                required
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select surplus food…</option>
                {surplus.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.quantity} {item.unit} ({item.donorName})
                  </option>
                ))}
              </select>

              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                required
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select recipient…</option>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={matching || !selectedItem || !selectedRecipient}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2"
              >
                {matching ? 'Matching…' : 'Match'}
              </button>
            </form>
          )}
        </div>
      )}

      {user.role === 'RECIPIENT' && (
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Available surplus food
          </h3>
          {surplus.length === 0 ? (
            <p className="text-sm text-slate-400">No surplus food available right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {surplus.map((item) => (
                <li key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800">
                      {item.name}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        from {item.donorName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.quantity} {item.unit} · {item.category} ·{' '}
                      {item.locationStored || 'no location'}
                    </div>
                  </div>
                  <ExpiryBadge days={item.daysToExpiry} />
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-400 mt-3">
            Ask your coordinator (admin) to match you with the items you need.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            {isAdmin
              ? 'All donation matches'
              : user.role === 'DONOR'
                ? 'Matches for my food'
                : 'My donation matches'}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No donation matches yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Food</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Matched at</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{m.foodItemName}</div>
                    <div className="text-xs text-slate-500">
                      {m.quantity} {m.unit} · {m.category}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.donorName || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{m.recipientName || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(m.matchedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[m.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 text-xs font-medium">
                      {isAdmin && m.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateStatus(m, 'CONFIRMED')}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(m, 'CANCELLED')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {!isAdmin && user.role === 'RECIPIENT' && m.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateStatus(m, 'CONFIRMED')}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateStatus(m, 'CANCELLED')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {m.status === 'PENDING' &&
                        user.role === 'DONOR' &&
                        !isAdmin && (
                          <span className="text-slate-400 font-normal">
                            awaiting coordinator
                          </span>
                        )}
                      {(m.status === 'CONFIRMED' || m.status === 'COMPLETED') &&
                        user.role !== 'DONOR' && (
                          <span className="text-slate-400 font-normal">
                            {m.status === 'COMPLETED' ? 'picked up' : 'awaiting pickup'}
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
