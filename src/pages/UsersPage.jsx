import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Button from '../components/Button'
import PasswordInput from '../components/PasswordInput'
import { TableActionsCell, TableActionsHeader, TableIconButton } from '../components/TableActions'
import { formatDate } from '../utils/format'

const VERIFIED_FILTERS = ['all', 'verified', 'unverified']
const REVIEW_FILTERS = ['all', 'has_reviews', 'no_reviews']
const emptyForm = { name: '', email: '', password: '', confirmPassword: '' }

export default function UsersPage() {
  const { canWrite } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    verified: 'all',
    reviews: 'all',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filteredUsers = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return users.filter((user) => {
      if (filters.verified === 'verified' && !user.email_verified) return false
      if (filters.verified === 'unverified' && user.email_verified) return false

      const reviewCount = Number(user.review_count) || 0
      if (filters.reviews === 'has_reviews' && reviewCount === 0) return false
      if (filters.reviews === 'no_reviews' && reviewCount > 0) return false

      if (!query) return true

      const haystack = [user.name, user.email].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [users, filters])

  const hasActiveFilters =
    filters.search.trim() !== '' || filters.verified !== 'all' || filters.reviews !== 'all'

  const updateFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))

  const clearFilters = () => {
    setFilters({
      search: '',
      verified: 'all',
      reviews: 'all',
    })
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setForm(emptyForm)
    setFormError('')
  }

  const openCreate = () => {
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!canWrite) return
    setFormError('')

    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    setSaving(true)
    try {
      await adminApi.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setFormError(err.message || 'Could not create user')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    if (!canWrite) return
    if (
      !window.confirm(
        `Remove reviewer account "${user.name}" (${user.email})? This cannot be undone.`,
      )
    ) {
      return
    }
    try {
      await adminApi.deleteUser(user.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        title="Manage Users"
        description="Create, view, and remove reviewer (customer) accounts"
      >
        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Create user
          </button>
        )}
      </PageHeader>

      {!canWrite && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Viewers have read-only access. Ask an admin to make changes.
        </p>
      )}

      <div className="card mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              onChange={updateFilter('search')}
              placeholder="Search name or email..."
              className="input-field pl-9"
              aria-label="Search users"
            />
          </div>

          <select
            className="input-field"
            value={filters.verified}
            onChange={updateFilter('verified')}
            aria-label="Filter by verification status"
          >
            <option value="all">All verification statuses</option>
            {VERIFIED_FILTERS.filter((value) => value !== 'all').map((value) => (
              <option key={value} value={value}>
                {value === 'verified' ? 'Verified email' : 'Unverified email'}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={filters.reviews}
            onChange={updateFilter('reviews')}
            aria-label="Filter by review activity"
          >
            <option value="all">All review activity</option>
            {REVIEW_FILTERS.filter((value) => value !== 'all').map((value) => (
              <option key={value} value={value}>
                {value === 'has_reviews' ? 'Has reviews' : 'No reviews yet'}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{filteredUsers.length}</span> of{' '}
          <span className="font-medium text-slate-700">{users.length}</span> users
        </p>
      </div>

      <div className="card table-scroll">
        <table className="data-table min-w-[44rem]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 font-medium text-gray-700">Reviews</th>
              <th className="px-4 py-3 font-medium text-gray-700">Verified</th>
              <th className="px-4 py-3 font-medium text-gray-700">Joined</th>
              {canWrite && <TableActionsHeader />}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                  {users.length === 0 ? 'No users found' : 'No users match your filters'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">{user.review_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.email_verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                  {canWrite && (
                    <TableActionsCell>
                      <TableIconButton
                        variant="danger"
                        title="Remove user"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </TableIconButton>
                    </TableActionsCell>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && canWrite && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-4 sm:py-10">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={closeModal} aria-hidden="true" />
          <div className="relative z-10 max-h-[96vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">Create user</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Same fields as the public signup form. Account is created verified (no email code).
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="create-user-name">
                  Full name
                </label>
                <input
                  id="create-user-name"
                  required
                  name="crm-user-name"
                  autoComplete="off"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="create-user-email">
                  Email
                </label>
                <input
                  id="create-user-email"
                  type="email"
                  required
                  name="crm-user-email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input-field"
                />
              </div>

              <PasswordInput
                id="create-user-password"
                name="crm-user-password"
                autoComplete="new-password"
                label="Password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder=""
                labelClassName="mb-1.5 block text-sm font-medium text-gray-700"
              />

              <PasswordInput
                id="create-user-confirm-password"
                name="crm-user-confirm-password"
                autoComplete="new-password"
                label="Confirm password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder=""
                labelClassName="mb-1.5 block text-sm font-medium text-gray-700"
              />

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create user'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
