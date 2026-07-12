import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminApi, ApiError } from '../services/api'
import Button from '../components/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user, token } = await adminApi.login(email, password)

      if (user.role !== 'admin') {
        setError('Access denied. Admin credentials required.')
        return
      }

      login(user, token)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="auth-panel hidden flex-col justify-between p-10 text-white lg:flex">
        <img src="/logo-check-a-review.png" alt="Check A Review" className="h-10 w-auto object-contain" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Admin CRM</p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight">
            Operate the platform with clarity and control.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Monitor users, moderate reviews, manage subscriptions, and configure platform settings from one professional workspace.
          </p>
        </div>
        <p className="text-xs text-slate-400">Secure admin access only</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <img src="/logo-check-a-review.png" alt="Check A Review" className="h-10 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Sign in</h2>
          <p className="mt-2 text-sm text-ink-muted">Use your administrator credentials to continue.</p>

          <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-6 sm:p-8">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label htmlFor="email" className="label-text text-slate-700">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="password" className="label-text text-slate-700">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
