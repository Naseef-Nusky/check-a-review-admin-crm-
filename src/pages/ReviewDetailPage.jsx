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
import { requestCrmBadgesRefresh } from '../utils/crmEvents'
import { useAuth } from '../context/AuthContext'

const statusColors = {
  [REVIEW_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [REVIEW_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [REVIEW_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [REVIEW_STATUS.REPORTED]: 'bg-orange-100 text-orange-800',
}

const emptyReviewDraft = { rating: 5, title: '', content: '' }

export default function ReviewDetailPage() {
  const { id } = useParams()
  const { canWrite } = useAuth()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const [editingReview, setEditingReview] = useState(false)
  const [reviewDraft, setReviewDraft] = useState(emptyReviewDraft)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')

  const [editingReply, setEditingReply] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getReview(id)
      .then((data) => {
        setReview(data)
        setReviewDraft({
          rating: Number(data?.rating) || 5,
          title: data?.title || '',
          content: data?.content || '',
        })
        setReplyDraft(data?.business_reply || '')
        setEditingReview(false)
        setEditingReply(false)
        setReviewMessage('')
        setReplyMessage('')
      })
      .catch((err) => setError(err.message || 'Failed to load review'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const moderate = async (status) => {
    setActionId(status)
    try {
      const updated = await adminApi.moderateReview(id, status)
      setReview((prev) => ({ ...prev, ...updated, status }))
      requestCrmBadgesRefresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionId(null)
    }
  }

  const startEditReview = () => {
    setReviewDraft({
      rating: Number(review.rating) || 5,
      title: review.title || '',
      content: review.content || '',
    })
    setEditingReview(true)
    setReviewMessage('')
  }

  const saveReview = async () => {
    const title = reviewDraft.title.trim()
    const content = reviewDraft.content.trim()
    const rating = Number(reviewDraft.rating)
    if (!title) {
      setReviewMessage('Title is required')
      return
    }
    if (content.length < 10) {
      setReviewMessage('Review content must be at least 10 characters')
      return
    }
    setReviewBusy(true)
    setReviewMessage('')
    try {
      const updated = await adminApi.updateReview(id, { rating, title, content })
      setReview((prev) => ({ ...prev, ...updated }))
      setEditingReview(false)
      setReviewMessage('Customer review updated')
    } catch (err) {
      setReviewMessage(err.message || 'Failed to update review')
    } finally {
      setReviewBusy(false)
    }
  }

  const startEditReply = () => {
    setReplyDraft(review.business_reply || '')
    setEditingReply(true)
    setReplyMessage('')
  }

  const saveReply = async () => {
    const text = replyDraft.trim()
    if (!text) {
      setReplyMessage('Reply text is required')
      return
    }
    const wasNew = !review.business_reply
    setReplyBusy(true)
    setReplyMessage('')
    try {
      const updated = await adminApi.updateReviewReply(id, text)
      setReview((prev) => ({ ...prev, ...updated }))
      setEditingReply(false)
      setReplyMessage(wasNew ? 'Reply posted' : 'Reply updated')
    } catch (err) {
      setReplyMessage(err.message || 'Failed to save reply')
    } finally {
      setReplyBusy(false)
    }
  }

  const deleteReply = async () => {
    if (!review.business_reply) return
    const confirmed = window.confirm(
      'Delete this business reply?\n\nIt will be removed from the public review page.',
    )
    if (!confirmed) return

    const note = window.prompt(
      'Optional reason for the business owner (leave blank to skip notifying them):',
      '',
    )
    if (note === null) return

    setReplyBusy(true)
    setReplyMessage('')
    try {
      const updated = await adminApi.rejectReviewReply(id, note.trim() || undefined)
      setReview((prev) => ({
        ...prev,
        ...updated,
        business_reply: null,
        business_reply_at: null,
      }))
      setReplyDraft('')
      setEditingReply(false)
      setReplyMessage('Reply deleted')
    } catch (err) {
      setReplyMessage(err.message || 'Failed to delete reply')
    } finally {
      setReplyBusy(false)
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
        {!canWrite && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Viewers have read-only access. Ask an admin to edit reviews or business replies.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[review.status] || 'bg-gray-100 text-gray-800'}`}>
            {review.status}
          </span>
          <span className="text-sm text-slate-500">{formatDate(review.created_at)}</span>
          {canWrite && (
            <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
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
          )}
        </div>

        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer review</p>
            {canWrite && !editingReview ? (
              <Button size="sm" variant="secondary" disabled={reviewBusy} onClick={startEditReview}>
                Edit review
              </Button>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewer profile</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{review.author_name || 'Customer'}</p>
            <p className="text-sm text-slate-600">{review.author_email || 'No email available'}</p>
          </div>

          {editingReview ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Rating</label>
                <select
                  className="input-field max-w-[10rem]"
                  value={reviewDraft.rating}
                  onChange={(e) =>
                    setReviewDraft((prev) => ({ ...prev, rating: Number(e.target.value) }))
                  }
                  disabled={reviewBusy}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
                <input
                  className="input-field"
                  value={reviewDraft.title}
                  onChange={(e) => setReviewDraft((prev) => ({ ...prev, title: e.target.value }))}
                  maxLength={255}
                  disabled={reviewBusy}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Content</label>
                <textarea
                  className="input-field min-h-[160px] resize-y"
                  value={reviewDraft.content}
                  onChange={(e) => setReviewDraft((prev) => ({ ...prev, content: e.target.value }))}
                  maxLength={10000}
                  disabled={reviewBusy}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={reviewBusy} onClick={saveReview}>
                  {reviewBusy ? 'Saving…' : 'Save review'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={reviewBusy}
                  onClick={() => {
                    setEditingReview(false)
                    setReviewDraft({
                      rating: Number(review.rating) || 5,
                      title: review.title || '',
                      content: review.content || '',
                    })
                    setReviewMessage('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StarRating rating={review.rating} size="sm" showValue />
                <span className="text-sm text-slate-500">by {review.author_name || 'Customer'}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{review.title || 'Untitled review'}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {review.content || '—'}
              </p>
            </>
          )}

          <p className="mt-4 text-sm text-slate-500">
            Business:{' '}
            <Link
              to={`/businesses/${review.business_id}?tab=reviews`}
              className="font-medium text-primary-600 hover:underline"
            >
              {review.business_name}
            </Link>
          </p>
          {reviewMessage ? <p className="mt-3 text-sm text-slate-600">{reviewMessage}</p> : null}
        </section>

        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Business owner reply
            </p>
            {canWrite && !editingReply ? (
              <div className="flex flex-wrap gap-2">
                {review.business_reply ? (
                  <>
                    <Button size="sm" variant="secondary" disabled={replyBusy} onClick={startEditReply}>
                      Edit reply
                    </Button>
                    <Button size="sm" variant="danger" disabled={replyBusy} onClick={deleteReply}>
                      Delete reply
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={replyBusy}
                    onClick={() => {
                      setReplyDraft('')
                      setEditingReply(true)
                      setReplyMessage('')
                    }}
                  >
                    Add reply
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          {editingReply ? (
            <div className="mt-3 space-y-3">
              <textarea
                className="input-field min-h-[140px] resize-y"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                maxLength={5000}
                disabled={replyBusy}
                placeholder="Write a public reply on behalf of the business…"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={replyBusy} onClick={saveReply}>
                  {replyBusy
                    ? 'Saving…'
                    : review.business_reply
                      ? 'Save reply'
                      : 'Post reply'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={replyBusy}
                  onClick={() => {
                    setEditingReply(false)
                    setReplyDraft(review.business_reply || '')
                    setReplyMessage('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : review.business_reply ? (
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

          {replyMessage ? <p className="mt-3 text-sm text-slate-600">{replyMessage}</p> : null}
        </section>
      </div>
    </div>
  )
}
