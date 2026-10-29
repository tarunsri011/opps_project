import { useEffect, useState } from 'react'
import api, { getUser, errorMessage } from '../services/api'
import PageHeader from '../components/PageHeader'

const STATUS_STYLES = {
  SCHEDULED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-sky-100 text-sky-700',
}

export default function Pickups() {
  const user = getUser()
  const isAdmin = user.role === 'ADMIN'

  const [pickups, setPickups] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ donationMatchId: '', scheduledAt: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [pickupRes, matchRes] = await Promise.all([
        api.get('/api/pickups'),
        api.get('/api/donations'),
      ])
      setPickups(pickupRes.data)
      setMatches(matchRes.data.filter((m) => m.status !== 'CANCELLED'))
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

  const schedule = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await api.post('/api/pickups', {
        donationMatchId: Number(form.donationMatchId),
        scheduledAt: form.scheduledAt.replace('T', 'T'),
        notes: form.notes || null,
      })
      setNotice('Pickup scheduled.')
      setForm({ donationMatchId: '', scheduledAt: '', notes: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const complete = async (pickup) => {
    setError('')
    setNotice('')
    try {
      await api.put(`/api/pickups/${pickup.id}/complete`)
      setNotice(`Pickup #${pickup.id} marked as completed.`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="p-8">
      <PageHeader
        title="Pickups"
        subtitle={
          isAdmin
            ? 'All scheduled pickups across recipients'
            : 'Your scheduled donation pickups'
        }
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition"
          >
            {showForm ? 'Close' : '+ Schedule pickup'}
          </button>
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

      {showForm && (
        <form
          onSubmit={schedule}
          className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5 mb-6 grid md:grid-cols-3 gap-4"
        >
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Donation match
            </span>
            <select
              required
              value={form.donationMatchId}
              onChange={set('donationMatchId')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a match…</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.id} {m.foodItemName} → {m.recipientName} ({m.status})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Scheduled date &amp; time
            </span>
            <input
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={set('scheduledAt')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Notes</span>
            <input
              value={form.notes}
              onChange={set('notes')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Side entrance, ring bell…"
            />
          </label>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2"
            >
              {saving ? 'Scheduling…' : 'Schedule pickup'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : pickups.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No pickups scheduled yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Food</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
                <th className="px-4 py-3 font-medium">Picked up</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pickups.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {p.foodItemName || `Match #${p.donationMatchId}`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.recipientName || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(p.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.pickedUpAt ? new Date(p.pickedUpAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && p.status === 'SCHEDULED' ? (
                      <button
                        onClick={() => complete(p)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Mark complete
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {p.status === 'COMPLETED' ? 'done' : 'awaiting admin'}
                      </span>
                    )}
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
