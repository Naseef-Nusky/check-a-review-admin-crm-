import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StarRating from '../components/StarRating'
import BusinessLogo from '../components/BusinessLogo'
import EditBusinessModal from '../components/EditBusinessModal'
import CreateReviewModal from '../components/CreateReviewModal'
import {
  cancellationNotice,
  formatCurrency,
  formatDate,
  isCancellationScheduled,
  subscriptionStatusLabel,
} from '../utils/format'
import { requestCrmBadgesRefresh } from '../utils/crmEvents'
import { REVIEW_STATUS } from '../utils/constants'
import { PaymentModeBadge } from '../components/SquareBillingBanner'

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
  const { canWrite } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab =
    searchParams.get('tab') === 'reviews'
      ? 'reviews'
      : searchParams.get('tab') === 'ownership'
        ? 'ownership'
        : 'overview'

  const [business, setBusiness] = useState(null)
  const [reviews, setReviews] = useState([])
  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState([])
  const [ownershipHistory, setOwnershipHistory] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [ownershipLoading, setOwnershipLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [moderating, setModerating] = useState(false)
  const [moderateError, setModerateError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [createReviewOpen, setCreateReviewOpen] = useState(false)
  const [categoryTree, setCategoryTree] = useState([])
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    makeOwner: false,
  })
  const [ownershipBusy, setOwnershipBusy] = useState(false)
  const [selectedOwnerMemberId, setSelectedOwnerMemberId] = useState('')
  const [showAddUserPassword, setShowAddUserPassword] = useState(false)

  const setTab = (tab) => {
    if (tab === 'reviews') setSearchParams({ tab: 'reviews' })
    else if (tab === 'ownership') setSearchParams({ tab: 'ownership' })
    else setSearchParams({})
  }

  useEffect(() => {
    adminApi.getBusinessCategories().then(setCategoryTree).catch(() => setCategoryTree([]))
  }, [])

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

  const loadOwnership = () => {
    setOwnershipLoading(true)
    Promise.all([
      adminApi.getBusinessUsers(id),
      adminApi.getOwnershipHistory(id).catch(() => []),
    ])
      .then(([users, history]) => {
        setMembers(users || [])
        setOwnershipHistory(history || [])
      })
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setOwnershipLoading(false))
  }

  useEffect(() => {
    if (activeTab !== 'ownership') return
    loadOwnership()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id])

  const handleAddUser = async (e) => {
    e.preventDefault()
    setOwnershipBusy(true)
    setError('')
    try {
      const member = await adminApi.addBusinessUser(id, addUserForm)
      const makeOwner = Boolean(addUserForm.makeOwner)
      setAddUserForm({ name: '', email: '', password: '', role: 'member', makeOwner: false })
      if (makeOwner && member?.id) {
        await adminApi.changeBusinessOwner(id, { memberId: member.id })
        const biz = await adminApi.getBusiness(id)
        setBusiness(biz)
        setSuccess('User added and set as primary owner')
      } else {
        setSuccess('User added')
      }
      loadOwnership()
    } catch (err) {
      setError(err.message || 'Failed to add user')
    } finally {
      setOwnershipBusy(false)
    }
  }

  const handleChangeOwner = async (memberId, name) => {
    if (!window.confirm(`Make ${name || 'this user'} the primary owner?`)) return
    setOwnershipBusy(true)
    try {
      await adminApi.changeBusinessOwner(id, { memberId })
      setSuccess('Owner updated')
      const biz = await adminApi.getBusiness(id)
      setBusiness(biz)
      loadOwnership()
    } catch (err) {
      alert(err.message)
    } finally {
      setOwnershipBusy(false)
    }
  }

  const handleMemberAction = async (memberId, data) => {
    setOwnershipBusy(true)
    try {
      if (data.remove) await adminApi.removeBusinessUser(id, memberId)
      else await adminApi.updateBusinessUser(id, memberId, data)
      loadOwnership()
    } catch (err) {
      alert(err.message)
    } finally {
      setOwnershipBusy(false)
    }
  }

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
      requestCrmBadgesRefresh()
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
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
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
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isCancellationScheduled(business)
                  ? 'bg-slate-200 text-slate-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {subscriptionStatusLabel(business)}
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
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                business.claimed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {business.claimed ? '✓ Claimed' : 'Unclaimed'}
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
        <button
          type="button"
          onClick={() => setTab('ownership')}
          className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'ownership'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Users & Ownership
        </button>
        </div>
      </div>

      {activeTab === 'ownership' ? (
        <div className="space-y-6">
          {ownershipLoading ? <LoadingSpinner /> : null}
          {!ownershipLoading ? (
            <>
              <div className="rounded-2xl border border-primary-200 bg-primary-50/50 p-5">
                <h3 className="text-base font-semibold text-slate-900">Change primary owner</h3>
                <p className="mt-1 text-sm text-slate-600">
                  The primary owner has full dashboard access. There can only be one primary owner.
                </p>
                {(() => {
                  const candidates = members.filter((m) => !m.is_primary_owner && m.status === 'active')
                  if (!canWrite) {
                    return <p className="mt-3 text-sm text-slate-500">Viewer accounts cannot change ownership.</p>
                  }
                  if (candidates.length === 0) {
                    return (
                      <p className="mt-3 text-sm text-amber-800">
                        No other active users yet. Use <strong>Add user</strong> below (tick “Make primary owner”
                        if you want), then you can change ownership here.
                      </p>
                    )
                  }
                  return (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="min-w-0 flex-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          New owner
                        </span>
                        <select
                          className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
                          value={selectedOwnerMemberId}
                          onChange={(e) => setSelectedOwnerMemberId(e.target.value)}
                        >
                          <option value="">Select a user…</option>
                          {candidates.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name || m.email} ({m.email})
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={ownershipBusy || !selectedOwnerMemberId}
                        className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                        onClick={async () => {
                          const m = candidates.find((c) => String(c.id) === String(selectedOwnerMemberId))
                          await handleChangeOwner(selectedOwnerMemberId, m?.name || m?.email)
                          setSelectedOwnerMemberId('')
                        }}
                      >
                        Change Owner
                      </button>
                    </div>
                  )
                })()}
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {member.is_primary_owner ? '👑 ' : ''}
                            {member.name || member.email}
                          </p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {member.is_primary_owner ? 'Owner' : member.role}
                        </td>
                        <td className="px-4 py-3 capitalize">{member.status}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {!member.is_primary_owner && member.status === 'active' ? (
                              <button
                                type="button"
                                disabled={ownershipBusy || !canWrite}
                                className="text-xs font-medium text-primary-700 hover:underline disabled:opacity-50"
                                onClick={() => handleChangeOwner(member.id, member.name || member.email)}
                              >
                                Make owner
                              </button>
                            ) : null}
                            {!member.is_primary_owner ? (
                              <>
                                <button
                                  type="button"
                                  disabled={ownershipBusy || !canWrite}
                                  className="text-xs font-medium text-slate-700 hover:underline disabled:opacity-50"
                                  onClick={() =>
                                    handleMemberAction(member.id, {
                                      status: member.status === 'disabled' ? 'active' : 'disabled',
                                    })
                                  }
                                >
                                  {member.status === 'disabled' ? 'Reactivate' : 'Disable'}
                                </button>
                                <button
                                  type="button"
                                  disabled={ownershipBusy || !canWrite}
                                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                                  onClick={() => handleMemberAction(member.id, { remove: true })}
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Primary owner</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No users found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {canWrite ? (
                <form
                  onSubmit={handleAddUser}
                  className="card space-y-4 p-5"
                  autoComplete="off"
                >
                  <h3 className="text-base font-semibold text-slate-900">Add user</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-xl border border-border px-3 py-2 text-sm"
                      placeholder="Full name"
                      name="business_member_name"
                      autoComplete="off"
                      required
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <input
                      className="rounded-xl border border-border px-3 py-2 text-sm"
                      placeholder="Email"
                      name="business_member_email"
                      type="email"
                      autoComplete="off"
                      required
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm((p) => ({ ...p, email: e.target.value }))}
                    />
                    <div className="relative">
                      <input
                        className="w-full rounded-xl border border-border px-3 py-2 pr-10 text-sm"
                        placeholder="Password"
                        name="business_member_password"
                        type={showAddUserPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={addUserForm.password}
                        onChange={(e) => setAddUserForm((p) => ({ ...p, password: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800"
                        onClick={() => setShowAddUserPassword((v) => !v)}
                        aria-label={showAddUserPassword ? 'Hide password' : 'Show password'}
                      >
                        {showAddUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <select
                      className="rounded-xl border border-border px-3 py-2 text-sm"
                      value={addUserForm.role}
                      onChange={(e) => setAddUserForm((p) => ({ ...p, role: e.target.value }))}
                    >
                      <option value="member">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={addUserForm.makeOwner}
                      onChange={(e) => setAddUserForm((p) => ({ ...p, makeOwner: e.target.checked }))}
                    />
                    Make this user the primary owner
                  </label>
                  <button
                    type="submit"
                    disabled={ownershipBusy}
                    className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    Add User
                  </button>
                </form>
              ) : null}

              <div className="card p-5">
                <h3 className="text-base font-semibold text-slate-900">Claim / ownership history</h3>
                <ul className="mt-4 space-y-3">
                  {ownershipHistory.length === 0 ? (
                    <li className="text-sm text-slate-500">No history yet</li>
                  ) : (
                    ownershipHistory.map((event) => (
                      <li key={event.id} className="border-b border-border pb-3 text-sm last:border-0">
                        <p className="font-medium text-slate-800">{event.event_type.replace(/_/g, ' ')}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.note || '—'} · {formatDate(event.created_at)}
                          {event.performed_by_name ? ` · by ${event.performed_by_name}` : ''}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'reviews' ? (
        <div className="space-y-4">
          {canWrite ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreateReviewOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Add review
              </button>
            </div>
          ) : null}
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
            </dl>
          </section>

          <section className="card p-6">
            <h3 className="text-base font-semibold text-slate-900">Owner account</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
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
            {isCancellationScheduled(business) ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">Cancellation scheduled</p>
                <p className="mt-1">{cancellationNotice(business)}</p>
              </div>
            ) : null}
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
              <DetailItem label="Status">{subscriptionStatusLabel(business)}</DetailItem>
              <DetailItem label="Period end">{formatDate(business.current_period_end)}</DetailItem>
              {isCancellationScheduled(business) ? (
                <DetailItem label="After period end">Moves to Free plan</DetailItem>
              ) : null}
              {isCancellationScheduled(business) ? (
                <DetailItem label="Refund policy">No refund for the current billing period</DetailItem>
              ) : null}
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Mode</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
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
                        <td className="px-3 py-2 text-sm">
                          <PaymentModeBadge isTest={payment.is_test !== false} />
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

      <EditBusinessModal
        open={editOpen}
        business={business}
        categoryTree={categoryTree}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setBusiness((prev) => ({ ...prev, ...updated }))
          setSuccess('Business updated successfully')
          setEditOpen(false)
        }}
      />

      <CreateReviewModal
        open={createReviewOpen}
        onClose={() => setCreateReviewOpen(false)}
        initialBusinessId={id}
        lockBusiness
        onCreated={async () => {
          loadReviews()
          requestCrmBadgesRefresh()
          try {
            const updated = await adminApi.getBusiness(id)
            setBusiness(updated)
          } catch {
            /* keep current business card */
          }
        }}
      />
    </div>
  )
}
