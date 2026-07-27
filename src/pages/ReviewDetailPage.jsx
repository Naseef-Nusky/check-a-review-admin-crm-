import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StarRating from '../components/StarRating'
import { REVIEW_STATUS } from '../utils/constants'
import { formatDate } from '../utils/format'

const statusColors = {
  [REVIEW_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [REVIEW_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [REVIEW_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [REVIEW_STATUS.REPORTED]: 'bg-orange-100 text-orange-800',
}

export default function ReviewDetailPage() {
  const { id } = useParams()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getReview(id)
      .then(setReview)
      .catch((err) => setError(err.message || 'Failed to load review'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const moderate = async (status) => {
    setActionId(status)
    try {
      const updated = await adminApi.moderateReview(id, status)
      setReview((prev) => ({ ...prev, ...updated, status }))
    } catch (err) {
      alert(err.message)
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!review) return <ErrorMessage message="Review not found" onRetry={load} />

  return (
    <div>
      <PageHeader
        kicker="Reviews"
        title="Review details"
        description="Customer review and business owner reply"
      >
        <Link
          to="/reviews"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to reviews
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[review.status] || 'bg-gray-100 text-gray-800'}`}>
            {review.status}
          </span>
          <span className="text-sm text-slate-500">{formatDate(review.created_at)}</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              disabled={actionId !== null || review.status === REVIEW_STATUS.PUBLISHED}
              onClick={() => moderate(REVIEW_STATUS.PUBLISHED)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={actionId !== null || review.status === REVIEW_STATUS.REJECTED}
              onClick={() => moderate(REVIEW_STATUS.REJECTED)}
            >
              Reject
            </Button>
          </div>
        </div>

        <section className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer review</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StarRating rating={review.rating} size="sm" showValue />
            <span className="text-sm text-slate-500">by {review.author_name || 'Customer'}</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">{review.title || 'Untitled review'}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {review.content || '—'}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Business:{' '}
            <Link
              to={`/businesses/${review.business_id}/reviews`}
              className="font-medium text-primary-600 hover:underline"
            >
              {review.business_name}
            </Link>
          </p>
        </section>

        <section className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business owner reply</p>
          {review.business_reply ? (
            <div className="mt-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {review.business_reply}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Replied {formatDate(review.business_reply_at)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No reply from the business owner yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
