import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { saveSession, errorMessage } from '../services/api'

const ROLES = [
  {
    value: 'DONOR',
    title: 'Donor',
    description: 'Restaurants, canteens and stores with surplus food',
  },
  {
    value: 'RECIPIENT',
    title: 'Recipient',
    description: 'Shelters and food banks receiving donations',
  },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', form)
      saveSession(data)
      navigate('/dashboard')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white">Create account</h1>
          <p className="text-slate-400 text-sm mt-2">
            Join the surplus redistribution network
          </p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => (
              <button
                type="button"
                key={role.value}
                onClick={() => setForm({ ...form, role: role.value })}
                className={`text-left rounded-lg border p-3 transition ${
                  form.role === role.value
                    ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">
                  {role.title}
                </div>
                <div className="text-xs text-slate-500 mt-1 leading-snug">
                  {role.description}
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Organization / your name
            </label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Campus Canteen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set('password')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition"
          >
            {loading ? 'Creating…' : `Register as ${form.role === 'DONOR' ? 'Donor' : 'Recipient'}`}
          </button>

          <p className="text-sm text-slate-500 text-center">
            Already registered?{' '}
            <Link to="/login" className="text-emerald-600 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
