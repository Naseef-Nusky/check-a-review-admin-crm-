import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StarRating from '../components/StarRating'
import BusinessLogo from '../components/BusinessLogo'
import { formatCurrency, formatDate } from '../utils/format'
import { REVIEW_STATUS, resolveMediaUrl } from '../utils/constants'

const statusColors = {
  [REVIEW_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [REVIEW_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [REVIEW_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [REVIEW_STATUS.REPORTED]: 'bg-orange-100 text-orange-800',
}

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">{children || '—'}</dd>
    </div>
  )
}

export default function BusinessDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'reviews' ? 'reviews' : 'overview'

  const [business, setBusiness] = useState(null)
  const [reviews, setReviews] = useState([])
  const [payments, setPayments] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [moderating, setModerating] = useState(false)
  const [moderateError, setModerateError] = useState('')

  const setTab = (tab) => {
    if (tab === 'reviews') setSearchParams({ tab: 'reviews' })
    else setSearchParams({})
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    ;(async () => {
      try {
        const [biz, history] = await Promise.all([
          adminApi.getBusiness(id),
          adminApi.getBusinessPayments(id).catch(() => []),
        ])
        if (cancelled) return
        setBusiness(biz)
        setPayments(history || [])
        setError('')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load business')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  const loadReviews = () => {
    setReviewsLoading(true)
    setReviewsError('')
    adminApi
      .getReviews()
      .then((allReviews) => {
        setReviews((allReviews || []).filter((review) => String(review.business_id) === String(id)))
      })
      .catch((err) => setReviewsError(err.message || 'Failed to load reviews'))
      .finally(() => setReviewsLoading(false))
  }

  useEffect(() => {
    if (activeTab !== 'reviews') return
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id])

  const handleDelete = async () => {
    if (!business) return
    const confirmed = window.confirm(
      `Remove business "${business.name}"?\n\nThis permanently deletes the business profile and owner account.`,
    )
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      await adminApi.deleteBusiness(id)
      navigate('/businesses', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to remove business')
      setDeleting(false)
    }
  }

  const handleModerate = async (status) => {
    setModerating(true)
    setModerateError('')
    try {
      const updated = await adminApi.moderateBusiness(id, status)
      setBusiness((prev) => ({ ...prev, ...updated }))
      setSuccess(status === 'published' ? 'Business approved and published' : 'Business listing rejected')
    } catch (err) {
      setModerateError(err.message || 'Failed to update listing status')
    } finally {
      setModerating(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />
  if (!business) return <ErrorMessage message="Business not found" />

  return (
    <div>
      <PageHeader
        kicker="Businesses"
        title={business.name}
        description="View business profile and account details"
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/businesses"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
          <button
            type="button"
            title="Remove"
            aria-label="Remove business"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </PageHeader>

      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {moderateError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {moderateError}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <BusinessLogo
          logoUrl={business.logo_url}
          name={business.name}
          className="h-20 w-20 rounded-2xl"
          textClassName="text-2xl"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-slate-900">{business.name}</h2>
          <p className="mt-1 text-sm text-slate-500">/{business.slug}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StarRating rating={Number(business.average_rating) || 0} size="sm" showValue />
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium capitalize text-primary-800">
              {business.plan || 'free'}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
              {business.subscription_status || 'active'}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                business.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : business.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}
            >
              Listing: {business.status || 'published'}
            </span>
          </div>
        </div>
      </div>

      {business.status === 'pending' ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">This listing is waiting for approval before it appears publicly.</p>
          <div className="action-row">
            <button
              type="button"
              disabled={moderating}
              onClick={() => handleModerate('published')}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Approve & Publish
            </button>
            <button
              type="button"
              disabled={moderating}
              onClick={() => handleModerate('rejected')}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-900 hover:text-white hover:border-red-900 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-6 border-b border-border">
        <div className="tab-scroll">
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'reviews'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Reviews
          {typeof business.review_count === 'number' ? (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {business.review_count}
            </span>
          ) : null}
        </button>
        </div>
      </div>

      {activeTab === 'reviews' ? (
        <div className="space-y-4">
          {reviewsLoading ? <LoadingSpinner /> : null}
          {reviewsError ? <ErrorMessage message={reviewsError} onRetry={loadReviews} /> : null}
          {!reviewsLoading && !reviewsError && reviews.length === 0 ? (
            <div className="card p-8 text-center text-sm text-slate-500">
              No reviews for this business yet.
            </div>
          ) : null}
          {!reviewsLoading &&
            !reviewsError &&
            reviews.map((review) => (
              <article key={review.id} className="card space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StarRating rating={review.rating} size="sm" showValue />
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          statusColors[review.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {review.status}
                      </span>
                      <span className="text-sm text-slate-500">{formatDate(review.created_at)}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      {review.title || 'Untitled review'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      by {review.author_name || 'Customer'}
                      {review.author_email ? ` · ${review.author_email}` : ''}
                    </p>
                  </div>
                  <Link
                    to={`/reviews/${review.id}`}
                    className="text-sm font-medium text-primary-600 hover:underline"
                  >
                    Open review
                  </Link>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {review.content || '—'}
                </p>

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
              </article>
            ))}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="card p-6">
            <h3 className="text-base font-semibold text-slate-900">Profile</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Business ID">{business.id}</DetailItem>
              <DetailItem label="Slug">{business.slug}</DetailItem>
              <DetailItem label="Category">{business.category}</DetailItem>
              <DetailItem label="Trust score">{business.trust_score ?? '—'}</DetailItem>
              <DetailItem label="Average rating">
                {Number(business.average_rating || 0).toFixed(1)}
              </DetailItem>
              <DetailItem label="Review count">{business.review_count ?? 0}</DetailItem>
              <DetailItem label="Created">{formatDate(business.created_at)}</DetailItem>
              <DetailItem label="Updated">{formatDate(business.updated_at)}</DetailItem>
              <div className="sm:col-span-2">
                <DetailItem label="Description">
                  <span className="whitespace-pre-wrap">{business.description || '—'}</span>
                </DetailItem>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <h3 className="text-base font-semibold text-slate-900">Contact</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Public email">{business.email}</DetailItem>
              <DetailItem label="Phone">{business.phone}</DetailItem>
              <div className="sm:col-span-2">
                <DetailItem label="Website">
                  {business.website ? (
                    <a
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {business.website}
                    </a>
                  ) : (
                    '—'
                  )}
                </DetailItem>
              </div>
              <div className="sm:col-span-2">
                <DetailItem label="Address">{business.address}</DetailItem>
              </div>
              <div className="sm:col-span-2">
                <DetailItem label="Logo URL">
                  {business.logo_url ? (
                    <a
                      href={resolveMediaUrl(business.logo_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {business.logo_url}
                    </a>
                  ) : (
                    '—'
                  )}
                </DetailItem>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <h3 className="text-base font-semibold text-slate-900">Owner account</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Owner ID">{business.owner_id || business.user_id}</DetailItem>
              <DetailItem label="Owner name">{business.owner_name}</DetailItem>
              <DetailItem label="Owner email">{business.owner_email}</DetailItem>
              <DetailItem label="Email verified">
                {business.owner_email_verified ? 'Yes' : 'No'}
              </DetailItem>
              <DetailItem label="Owner joined">{formatDate(business.owner_created_at)}</DetailItem>
            </dl>
          </section>

          <section className="card p-6">
            <h3 className="text-base font-semibold text-slate-900">Subscription</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Plan">
                <span className="capitalize">{business.plan || 'free'}</span>
              </DetailItem>
              <DetailItem label="Pending plan">
                {business.pending_plan ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium capitalize text-amber-800">
                    {business.pending_plan}
                  </span>
                ) : (
                  '—'
                )}
              </DetailItem>
              <DetailItem label="Status">
                <span className="capitalize">{(business.subscription_status || '—').replace('_', ' ')}</span>
              </DetailItem>
              <DetailItem label="Period end">{formatDate(business.current_period_end)}</DetailItem>
              <DetailItem label="Subscription updated">
                {formatDate(business.subscription_updated_at || business.subscription_created_at)}
              </DetailItem>
              <DetailItem label="Subscription created">
                {formatDate(business.subscription_created_at)}
              </DetailItem>
              <DetailItem label="Square customer">
                {business.square_customer_id || '—'}
              </DetailItem>
              <DetailItem label="Square subscription">
                {business.square_subscription_id || '—'}
              </DetailItem>
            </dl>
          </section>

          <section className="card p-6 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">Payment history</h3>
              <Link to="/payments" className="text-sm font-medium text-primary-700 hover:underline">
                View all payments
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="data-table min-w-[36rem]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Plan</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500">
                        No payments recorded for this business yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-sm text-gray-600">{formatDate(payment.created_at)}</td>
                        <td className="px-3 py-2 text-sm capitalize">{payment.plan || '—'}</td>
                        <td className="px-3 py-2 text-sm font-medium">
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td className="px-3 py-2 text-sm capitalize">{payment.status || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
