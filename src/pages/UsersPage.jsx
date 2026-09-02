import { useEffect, useMemo, useState } from 'react'
import { Search, Trash2, X } from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { TableActionsCell, TableActionsHeader, TableIconButton } from '../components/TableActions'
import { formatDate } from '../utils/format'

const VERIFIED_FILTERS = ['all', 'verified', 'unverified']
const REVIEW_FILTERS = ['all', 'has_reviews', 'no_reviews']

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
      <PageHeader title="Manage Users" description="View and remove reviewer accounts" />

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
    </div>
  )
}
