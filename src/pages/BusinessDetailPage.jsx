import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StarRating from '../components/StarRating'
import { formatDate } from '../utils/format'
import { REVIEW_STATUS, resolveMediaUrl } from '../utils/constants'

const statusColors = {
  [REVIEW_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [REVIEW_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [REVIEW_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [REVIEW_STATUS.REPORTED]: 'bg-orange-100 text-orange-800',
}

const PLAN_OPTIONS = ['free', 'starter', 'premium']
const SUBSCRIPTION_STATUS_OPTIONS = ['active', 'cancelled', 'past_due', 'trialing']

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">{children || '—'}</dd>
    </div>
  )
}

function businessToForm(business, categoryTree) {
  const matchingMain = categoryTree.find((main) =>
    main.subcategories.some((sub) => sub.name.toLowerCase() === String(business.category || '').toLowerCase()),
  )
  return {
    name: business.name || '',
    mainCategoryId: matchingMain?.id || '',
    category: business.category || '',
    description: business.description || '',
    website: business.website || '',
    email: business.email || '',
    phone: business.phone || '',
    address: business.address || '',
    owner_name: business.owner_name || '',
    owner_email: business.owner_email || '',
    plan: business.plan || 'free',
    subscription_status: business.subscription_status || 'active',
  }
}

export default function BusinessDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const editing = location.pathname.endsWith('/edit')
  const activeTab = editing ? 'overview' : searchParams.get('tab') === 'reviews' ? 'reviews' : 'overview'

  const [business, setBusiness] = useState(null)
  const [categoryTree, setCategoryTree] = useState([])
  const [form, setForm] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')
  const [moderating, setModerating] = useState(false)

  const setTab = (tab) => {
    if (tab === 'reviews') setSearchParams({ tab: 'reviews' })
    else setSearchParams({})
  }

  useEffect(() => {
    if (location.state?.saved) {
      setSuccess('Business updated successfully')
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setSaveError('')

    ;(async () => {
      try {
        const biz = await adminApi.getBusiness(id)
        if (cancelled) return
        setBusiness(biz)
        setForm(businessToForm(biz, categoryTree))
        setError('')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load business')
      } finally {
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!editing || categoryTree.length > 0) return
    let cancelled = false
    adminApi
      .getBusinessCategories()
      .then((categories) => {
        if (cancelled) return
        setCategoryTree(categories)
        setForm((prev) => (business ? businessToForm(business, categories) : prev))
      })
      .catch(() => {
        if (!cancelled) setCategoryTree([])
      })
    return () => {
      cancelled = true
    }
  }, [editing, categoryTree.length, business])

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
    if (activeTab !== 'reviews' || editing) return
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, editing, id])

  const subcategoryOptions = useMemo(() => {
    const main = categoryTree.find((item) => item.id === form?.mainCategoryId)
    return main?.subcategories || []
  }, [categoryTree, form?.mainCategoryId])

  const categoryInTree = useMemo(() => {
    if (!form?.category) return false
    return categoryTree.some((main) =>
      main.subcategories.some((sub) => sub.name.toLowerCase() === form.category.toLowerCase()),
    )
  }, [categoryTree, form?.category])

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleMainCategoryChange = (e) => {
    const mainCategoryId = e.target.value
    setForm((prev) => ({ ...prev, mainCategoryId, category: '' }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form?.category) {
      setSaveError('Please select a category')
      return
    }

    setSaving(true)
    setSaveError('')
    setSuccess('')
    try {
      const updated = await adminApi.updateBusiness(id, {
        name: form.name,
        category: form.category,
        description: form.description || null,
        website: form.website || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        owner_name: form.owner_name || null,
        owner_email: form.owner_email || null,
        plan: form.plan,
        subscription_status: form.subscription_status,
      })
      setBusiness(updated)
      setForm(businessToForm(updated, categoryTree))
      navigate(`/businesses/${id}`, { replace: true, state: { saved: true } })
    } catch (err) {
      setSaveError(err.message || 'Failed to update business')
    } finally {
      setSaving(false)
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
    setSaveError('')
    try {
      const updated = await adminApi.moderateBusiness(id, status)
      setBusiness((prev) => ({ ...prev, ...updated }))
      setSuccess(status === 'published' ? 'Business approved and published' : 'Business listing rejected')
    } catch (err) {
      setSaveError(err.message || 'Failed to update listing status')
    } finally {
      setModerating(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />
  if (!business || !form) return <ErrorMessage message="Business not found" />

  const logoSrc = resolveMediaUrl(business.logo_url)

  return (
    <div>
      <PageHeader
        kicker="Businesses"
        title={business.name}
        description={editing ? 'Edit business profile and account details' : 'Full business profile and account details'}
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/businesses"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
          {!editing ? (
            <>
              <Link
                to={`/businesses/${id}/edit`}
                title="Edit"
                aria-label="Edit business"
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 p-2.5 text-white hover:bg-primary-700"
              >
                <Pencil className="h-4 w-4" />
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
            </>
          ) : (
            <Link
              to={`/businesses/${id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel edit
            </Link>
          )}
        </div>
      </PageHeader>

      {success && !editing ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl">
          {logoSrc ? (
            <img src={logoSrc} alt={`${business.name} logo`} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-2xl font-semibold text-slate-300">
              {(business.name || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
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

      {!editing && business.status === 'pending' ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">This listing is waiting for approval before it appears publicly.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={moderating}
              onClick={() => handleModerate('published')}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Approve & Publish
            </button>
            <button
              type="button"
              disabled={moderating}
              onClick={() => handleModerate('rejected')}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      {!editing ? (
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
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
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
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
      ) : null}

      {activeTab === 'reviews' && !editing ? (
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
      ) : null}

      {editing ? (
        <form onSubmit={handleSave} className="card space-y-6 p-6">
          {saveError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}

          <section>
            <h3 className="text-base font-semibold text-slate-900">Profile</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="name">
                  Business name
                </label>
                <input id="name" required className="input-field" value={form.name} onChange={handleChange('name')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="mainCategory">
                  Main category
                </label>
                <select
                  id="mainCategory"
                  className="input-field"
                  value={form.mainCategoryId}
                  onChange={handleMainCategoryChange}
                >
                  <option value="">{categoryInTree ? 'Select main category' : 'Keep current category'}</option>
                  {categoryTree.map((main) => (
                    <option key={main.id} value={main.id}>{main.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="category">
                  Subcategory
                </label>
                {form.mainCategoryId ? (
                  <select
                    id="category"
                    required
                    className="input-field"
                    value={form.category}
                    onChange={handleChange('category')}
                  >
                    <option value="">Select subcategory</option>
                    {subcategoryOptions.map((sub) => (
                      <option key={sub.id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="category"
                    required
                    className="input-field"
                    value={form.category}
                    onChange={handleChange('category')}
                    placeholder="Current category"
                  />
                )}
                {!categoryInTree && form.category ? (
                  <p className="mt-1 text-xs text-amber-600">
                    Current category is not in the category tree. You can keep it or choose a new main + subcategory.
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  className="input-field min-h-[110px] resize-none"
                  value={form.description}
                  onChange={handleChange('description')}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900">Contact</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
                  Public email
                </label>
                <input id="email" type="email" className="input-field" value={form.email} onChange={handleChange('email')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="phone">
                  Phone
                </label>
                <input id="phone" className="input-field" value={form.phone} onChange={handleChange('phone')} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="website">
                  Website
                </label>
                <input id="website" className="input-field" value={form.website} onChange={handleChange('website')} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="address">
                  Address
                </label>
                <input id="address" className="input-field" value={form.address} onChange={handleChange('address')} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900">Owner account</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="owner_name">
                  Owner name
                </label>
                <input id="owner_name" className="input-field" value={form.owner_name} onChange={handleChange('owner_name')} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="owner_email">
                  Owner email
                </label>
                <input
                  id="owner_email"
                  type="email"
                  required
                  className="input-field"
                  value={form.owner_email}
                  onChange={handleChange('owner_email')}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900">Subscription</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="plan">
                  Plan
                </label>
                <select id="plan" className="input-field" value={form.plan} onChange={handleChange('plan')}>
                  {PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="subscription_status">
                  Status
                </label>
                <select
                  id="subscription_status"
                  className="input-field"
                  value={form.subscription_status}
                  onChange={handleChange('subscription_status')}
                >
                  {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Link
              to={`/businesses/${id}`}
              className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : activeTab === 'overview' ? (
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
                    <a href={logoSrc} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
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
              <DetailItem label="Status">
                <span className="capitalize">{business.subscription_status || '—'}</span>
              </DetailItem>
              <DetailItem label="Period end">{formatDate(business.current_period_end)}</DetailItem>
              <DetailItem label="Subscription created">
                {formatDate(business.subscription_created_at)}
              </DetailItem>
              <DetailItem label="Stripe customer">{business.stripe_customer_id}</DetailItem>
              <DetailItem label="Stripe subscription">{business.stripe_subscription_id}</DetailItem>
            </dl>
          </section>
        </div>
      ) : null}
    </div>
  )
}
