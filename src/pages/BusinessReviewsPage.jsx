import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StarRating from '../components/StarRating'
import { formatDate } from '../utils/format'

export default function BusinessReviewsPage() {
  const { id } = useParams()
  const [business, setBusiness] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([adminApi.getBusiness(id), adminApi.getReviews()])
      .then(([biz, allReviews]) => {
        setBusiness(biz)
        setReviews(allReviews.filter((review) => review.business_id === id))
      })
      .catch((err) => setError(err.message || 'Failed to load reviews'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!business) return <ErrorMessage message="Business not found" onRetry={load} />

  return (
    <div>
      <PageHeader
        kicker="Reviews"
        title={business.name}
        description="Customer reviews and business owner replies"
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
        {reviews.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            No customer reviews for this business yet.
          </div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="card space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer review
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <StarRating rating={review.rating} size="sm" showValue />
                  <span className="text-sm text-slate-500">
                    by {review.author_name || 'Customer'} · {formatDate(review.created_at)}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">
                  {review.title || 'Untitled review'}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {review.content || '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Business owner reply
                </p>
                {review.business_reply ? (
                  <>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {review.business_reply}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Replied {formatDate(review.business_reply_at)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No reply yet.</p>
                )}
              </div>

              <Link
                to={`/reviews/${review.id}`}
                className="inline-flex text-sm font-medium text-primary-600 hover:underline"
              >
                Open review
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
