import { useEffect, useState } from 'react'
import api, { errorMessage } from '../services/api'
import PageHeader from '../components/PageHeader'

const EMPTY = { name: '', email: '', password: '' }

export default function Recipients() {
  const [recipients, setRecipients] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [recRes, matchRes] = await Promise.all([
        api.get('/api/recipients'),
        api.get('/api/donations'),
      ])
      setRecipients(recRes.data)
      setMatches(matchRes.data)
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

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await api.post('/api/recipients', form)
      setNotice(`Recipient "${form.name}" registered.`)
      setForm(EMPTY)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const historyFor = (id) => matches.filter((m) => m.recipientId === id)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="p-8">
      <PageHeader
        title="Recipients"
        subtitle="Registered organizations that receive donated food"
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition"
          >
            {showForm ? 'Close' : '+ Register recipient'}
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
          onSubmit={create}
          className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5 mb-6 grid md:grid-cols-4 gap-4"
        >
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Name</span>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Night Shelter"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="shelter@example.org"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set('password')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Temporary password"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
            >
              {saving ? 'Saving…' : 'Register'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : recipients.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No recipients registered yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recipients.map((r) => {
              const history = historyFor(r.id)
              const open = expanded === r.id
              return (
                <li key={r.id}>
                  <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-800">
                          {history.length}
                        </div>
                        <div className="text-[11px] text-slate-400">donations</div>
                      </div>
                      <button
                        onClick={() => setExpanded(open ? null : r.id)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        {open ? 'Hide history' : 'View history'}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="bg-slate-50 px-5 py-4 border-t border-slate-100">
                      {history.length === 0 ? (
                        <p className="text-xs text-slate-400">No donations yet.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="text-left text-slate-500">
                            <tr>
                              <th className="py-2 font-medium">Food</th>
                              <th className="py-2 font-medium">Donor</th>
                              <th className="py-2 font-medium">Matched</th>
                              <th className="py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {history.map((m) => (
                              <tr key={m.id}>
                                <td className="py-2 text-slate-700">
                                  {m.foodItemName} ({m.quantity} {m.unit})
                                </td>
                                <td className="py-2 text-slate-600">{m.donorName || '—'}</td>
                                <td className="py-2 text-slate-600">
                                  {new Date(m.matchedAt).toLocaleDateString()}
                                </td>
                                <td className="py-2">
                                  <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 font-medium">
                                    {m.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
