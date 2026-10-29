import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { saveSession, errorMessage } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      saveSession(data)
      navigate('/dashboard')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white">FoodShare</h1>
          <p className="text-slate-400 text-sm mt-2">
            Food expiry &amp; surplus redistribution
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>

          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-sm text-slate-500 text-center">
            No account?{' '}
            <Link to="/register" className="text-emerald-600 font-medium">
              Register
            </Link>
          </p>

          <div className="text-xs text-slate-400 border-t pt-3 leading-5">
            Demo: admin@food.org / admin123 · donor@food.org / donor123 ·
            recipient@food.org / recip123
          </div>
        </form>
      </div>
    </div>
  )
}
