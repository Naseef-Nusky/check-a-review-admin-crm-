import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { adminApi, ApiError } from '../services/api'
import { isCrmRole } from '../utils/constants'
import Button from '../components/Button'
import PasswordInput from '../components/PasswordInput'
import DomainEmailInput, { toCrmEmail } from '../components/DomainEmailInput'

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
      const { user, token } = await adminApi.login(toCrmEmail(email), password)

      if (!isCrmRole(user.role)) {
        setError('Access denied. CRM credentials required.')
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
    <div className="flex min-h-screen flex-col bg-slate-950">
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto inline-flex rounded-2xl bg-slate-900 p-3 ring-1 ring-white/10">
            <Link to="/">
              <img
                src="/logo-check-a-review.png"
                alt="Check A Review"
                className="h-10 w-auto object-contain sm:h-11"
              />
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <LockKeyhole className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Admin sign in</h1>
                <p className="text-sm text-slate-500">Use your administrator credentials</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <DomainEmailInput
                id="email"
                label="Email address"
                required
                value={email}
                onChange={setEmail}
                placeholder=""
                labelClassName="mb-1.5 block text-sm font-medium text-slate-700"
              />

              <PasswordInput
                id="password"
                label="Password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />

              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in to admin'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
              Authorized administrators only.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
