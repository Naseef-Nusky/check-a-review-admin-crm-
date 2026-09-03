import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, MessageSquare, Plus, Search, X } from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import CreateReviewModal from '../components/CreateReviewModal'
import {
  TableActionButton,
  TableActionsCell,
  TableActionsHeader,
  TableIconButton,
} from '../components/TableActions'
import { REVIEW_STATUS } from '../utils/constants'
import { formatDate } from '../utils/format'
import { requestCrmBadgesRefresh } from '../utils/crmEvents'
import StarRating from '../components/StarRating'

const statusColors = {
  [REVIEW_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [REVIEW_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [REVIEW_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [REVIEW_STATUS.REPORTED]: 'bg-orange-100 text-orange-800',
}

const STATUS_FILTERS = ['all', 'pending', 'published', 'rejected', 'reported']
const REPLY_FILTERS = ['all', 'with_reply', 'no_reply']

export default function ReviewsPage() {
  const { canWrite } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    reply: 'all',
  })

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getReviews()
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filteredReviews = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return reviews.filter((review) => {
      if (filters.status !== 'all' && review.status !== filters.status) return false
      if (filters.reply === 'with_reply' && !review.business_reply) return false
      if (filters.reply === 'no_reply' && review.business_reply) return false

      if (!query) return true

      const haystack = [
        review.business_name,
        review.author_name,
        review.author_email,
        review.title,
        review.content,
        review.business_reply,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [reviews, filters])

  const hasActiveFilters =
    filters.search.trim() !== '' || filters.status !== 'all' || filters.reply !== 'all'

  const updateFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))

  const clearFilters = () => {
    setFilters({ search: '', status: 'all', reply: 'all' })
  }

  const moderate = async (id, status) => {
    setActionId(id)
    try {
      await adminApi.moderateReview(id, status)
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      requestCrmBadgesRefresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader title="Moderate Reviews" description="Add reviews to businesses, view replies, and moderate content">
        {canWrite && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Add review
          </button>
        )}
      </PageHeader>

      {!canWrite && (
        <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Viewers have read-only access. Ask an admin to add or moderate reviews.
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
              placeholder="Search business, author, title, reply..."
              className="input-field pl-9"
              aria-label="Search reviews"
            />
          </div>
          <select className="input-field" value={filters.status} onChange={updateFilter('status')} aria-label="Filter by status">
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : status}
              </option>
            ))}
          </select>
          <select className="input-field" value={filters.reply} onChange={updateFilter('reply')} aria-label="Filter by reply">
            <option value="all">All replies</option>
            <option value="with_reply">With business reply</option>
            <option value="no_reply">No reply yet</option>
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
          Showing <span className="font-medium text-slate-700">{filteredReviews.length}</span> of{' '}
          <span className="font-medium text-slate-700">{reviews.length}</span> reviews
        </p>
      </div>

      <div className="card table-scroll">
        <table className="data-table min-w-[1000px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Review</th>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Author</th>
              <th className="px-4 py-3 font-medium text-gray-700">Rating</th>
              <th className="px-4 py-3 font-medium text-gray-700">Reply</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 font-medium text-gray-700">Date</th>
              <TableActionsHeader />
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {reviews.length === 0 ? 'No reviews found' : 'No reviews match your filters'}
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => (
                <tr key={review.id} className="border-b border-gray-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link to={`/reviews/${review.id}`} className="block min-w-0 max-w-xs">
                      <p className="truncate font-medium text-slate-900 hover:text-primary-600">
                        {review.title || 'Untitled review'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{review.content}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to={`/businesses/${review.business_id}?tab=reviews`}
                      className="text-slate-900 hover:text-primary-600 hover:underline"
                    >
                      {review.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{review.author_name || 'Customer'}</p>
                      <p className="truncate text-xs text-slate-500">{review.author_email || 'No email'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={review.rating} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {review.business_reply ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                        <MessageSquare className="h-3 w-3" />
                        Replied
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">No reply</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[review.status] || 'bg-gray-100 text-gray-800'}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(review.created_at)}</td>
                  <TableActionsCell>
                    <TableIconButton
                      to={`/reviews/${review.id}`}
                      title="View review details"
                      ariaLabel={`View review ${review.title || review.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </TableIconButton>
                    <TableActionButton
                      variant="success"
                      icon={Check}
                      disabled={actionId === review.id}
                      onClick={() => moderate(review.id, REVIEW_STATUS.PUBLISHED)}
                      title="Approve review"
                    >
                      Approve
                    </TableActionButton>
                    <TableActionButton
                      variant="danger"
                      icon={X}
                      disabled={actionId === review.id}
                      onClick={() => moderate(review.id, REVIEW_STATUS.REJECTED)}
                      title="Reject review"
                    >
                      Reject
                    </TableActionButton>
                  </TableActionsCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateReviewModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          load()
          requestCrmBadgesRefresh()
        }}
      />
    </div>
  )
}
