import { useEffect, useState } from 'react'
import api, { getUser, errorMessage } from '../services/api'
import PageHeader from '../components/PageHeader'
import ExpiryBadge from '../components/ExpiryBadge'

const EMPTY = {
  name: '',
  category: '',
  quantity: '',
  unit: '',
  expiryDate: '',
  locationStored: '',
  status: 'AVAILABLE',
}

const STATUS_STYLES = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  SURPLUS: 'bg-orange-100 text-orange-700',
  DONATED: 'bg-sky-100 text-sky-700',
  EXPIRED: 'bg-red-100 text-red-700',
}

export default function Inventory() {
  const user = getUser()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | item being edited
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/food-items')
      const visible = user.role === 'DONOR' ? data.filter((i) => i.donorId === user.id) : data
      setItems(visible)
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

  const openCreate = () => {
    setForm(EMPTY)
    setModal('create')
  }

  const openEdit = (item) => {
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate,
      locationStored: item.locationStored || '',
      status: item.status,
    })
    setModal(item)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      locationStored: form.locationStored || null,
    }
    try {
      if (modal === 'create') {
        await api.post('/api/food-items', payload)
      } else {
        await api.put(`/api/food-items/${modal.id}`, payload)
      }
      setModal(null)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const markSurplus = async (item) => {
    setError('')
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
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This also removes its donation records.`)) return
    setError('')
    try {
      await api.delete(`/api/food-items/${item.id}`)
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="p-8">
      <PageHeader
        title="Inventory"
        subtitle={
          user.role === 'DONOR'
            ? 'Your food items — expiring first'
            : 'All registered food items'
        }
        action={
          <button
            onClick={openCreate}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition"
          >
            + Add item
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No food items yet — add your first one.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{item.name}</div>
                    <div className="text-xs text-slate-400">by {item.donorName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.category}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-600 mb-1">{item.expiryDate}</div>
                    <ExpiryBadge days={item.daysToExpiry} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[item.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.locationStored || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'AVAILABLE' && (
                        <button
                          onClick={() => markSurplus(item)}
                          className="text-xs font-medium text-orange-600 hover:text-orange-700"
                        >
                          Mark surplus
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(item)}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Edit
                      </button>
                      {user.role === 'ADMIN' && (
                        <button
                          onClick={() => remove(item)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={save}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {modal === 'create' ? 'Add food item' : `Edit ${modal.name}`}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" className="col-span-2">
                <input required value={form.name} onChange={set('name')} className={inputCls} />
              </Field>
              <Field label="Category">
                <input
                  required
                  value={form.category}
                  onChange={set('category')}
                  className={inputCls}
                  placeholder="Dairy, Bakery…"
                />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={set('status')} className={inputCls}>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="SURPLUS">SURPLUS</option>
                  <option value="DONATED">DONATED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.quantity}
                  onChange={set('quantity')}
                  className={inputCls}
                />
              </Field>
              <Field label="Unit">
                <input
                  required
                  value={form.unit}
                  onChange={set('unit')}
                  className={inputCls}
                  placeholder="kg, litres…"
                />
              </Field>
              <Field label="Expiry date">
                <input
                  required
                  type="date"
                  value={form.expiryDate}
                  onChange={set('expiryDate')}
                  className={inputCls}
                />
              </Field>
              <Field label="Location stored">
                <input
                  value={form.locationStored}
                  onChange={set('locationStored')}
                  className={inputCls}
                  placeholder="Fridge 1"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  )
}
