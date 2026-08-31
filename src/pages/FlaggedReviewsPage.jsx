import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { REVIEW_STATUS } from '../utils/constants'
import { formatDate } from '../utils/format'
import { requestCrmBadgesRefresh } from '../utils/crmEvents'

export default function FlaggedReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getFlaggedReviews()
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const moderate = async (id, status) => {
    setActionId(id)
    try {
      await adminApi.moderateReview(id, status)
      setReviews((prev) => prev.filter((r) => r.id !== id))
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
      <PageHeader
        title="Pending review queue"
        description="Reviews held in processing after automated / AI checks — publish or reject manually"
      />
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          No reviews waiting in the processing queue
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card border-amber-200 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{review.business_name}</span>
                    <span className="hidden text-gray-400 sm:inline">•</span>
                    <span className="text-sm text-gray-500">{review.author_name || 'Customer'}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 break-all">{review.author_email || 'No email'}</p>
                  <p className="mt-2 text-sm text-gray-600">{review.content}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(review.created_at)}</p>
                </div>
                <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {review.ai_flags?.length > 0 && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                      {review.ai_flags.join(', ')}
                    </span>
                  )}
                  <span className="text-xs font-medium text-red-600">
                    Risk: {review.ai_risk_score ?? '—'}
                  </span>
                </div>
              </div>
              <div className="action-row mt-4">
                <Link
                  to={`/reviews/${review.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  View details
                </Link>
                <Button
                  size="sm"
                  disabled={actionId === review.id}
                  onClick={() => moderate(review.id, REVIEW_STATUS.PUBLISHED)}
                >
                  Approve & Publish
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={actionId === review.id}
                  onClick={() => moderate(review.id, REVIEW_STATUS.REJECTED)}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
