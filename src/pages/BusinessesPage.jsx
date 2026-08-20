import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Search, Trash2, X } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import CreateBusinessWizard from '../components/CreateBusinessWizard'
import { formatDate } from '../utils/format'
import StarRating from '../components/StarRating'
import BusinessLogo from '../components/BusinessLogo'

const PLAN_FILTERS = ['all', 'free', 'starter', 'plus', 'premium', 'enterprise']
const STATUS_FILTERS = ['all', 'active', 'cancelled', 'past_due', 'trialing']
const LISTING_STATUS_FILTERS = ['all', 'pending', 'published', 'rejected']

const listingStatusClass = {
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [categoryTree, setCategoryTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    plan: 'all',
    status: 'all',
    listingStatus: 'all',
  })

  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([adminApi.getBusinesses(), adminApi.getBusinessCategories()])
      .then(([businessList, categories]) => {
        setBusinesses(businessList)
        setCategoryTree(categories)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const categoryOptions = useMemo(() => {
    const values = new Set()
    businesses.forEach((biz) => {
      if (biz.category) values.add(biz.category)
    })
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [businesses])

  const filteredBusinesses = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return businesses.filter((biz) => {
      if (filters.category !== 'all' && biz.category !== filters.category) return false
      if (filters.plan !== 'all' && (biz.plan || 'free') !== filters.plan) return false
      if (filters.status !== 'all' && (biz.subscription_status || 'active') !== filters.status) {
        return false
      }
      if (filters.listingStatus !== 'all' && (biz.status || 'published') !== filters.listingStatus) {
        return false
      }

      if (!query) return true

      const haystack = [
        biz.name,
        biz.slug,
        biz.category,
        biz.email,
        biz.owner_email,
        biz.owner_name,
        biz.phone,
        biz.website,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [businesses, filters])

  const hasActiveFilters =
    filters.search.trim() !== ''
    || filters.category !== 'all'
    || filters.plan !== 'all'
    || filters.status !== 'all'
    || filters.listingStatus !== 'all'

  const updateFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      plan: 'all',
      status: 'all',
      listingStatus: 'all',
    })
  }

  const handleDelete = async (biz) => {
    const confirmed = window.confirm(
      `Remove business "${biz.name}"?\n\nThis permanently deletes the business profile and owner account.`,
    )
    if (!confirmed) return

    setDeletingId(biz.id)
    setActionError('')
    try {
      await adminApi.deleteBusiness(biz.id)
      setBusinesses((prev) => prev.filter((item) => item.id !== biz.id))
    } catch (err) {
      setActionError(err.message || 'Failed to remove business')
    } finally {
      setDeletingId('')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader title="Manage Businesses" description="View and manage business accounts">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
        >
          + Add business
        </button>
      </PageHeader>

      {actionError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="card mb-4 p-4">
        <div className="filter-grid">
          <div className="relative sm:col-span-2 2xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              onChange={updateFilter('search')}
              placeholder="Search name, email, owner..."
              className="input-field pl-9"
              aria-label="Search businesses"
            />
          </div>

          <select
            className="input-field"
            value={filters.category}
            onChange={updateFilter('category')}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={filters.plan}
            onChange={updateFilter('plan')}
            aria-label="Filter by plan"
          >
            {PLAN_FILTERS.map((plan) => (
              <option key={plan} value={plan}>
                {plan === 'all' ? 'All plans' : plan}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={filters.listingStatus}
            onChange={updateFilter('listingStatus')}
            aria-label="Filter by listing status"
          >
            {LISTING_STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All listing statuses' : status}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={filters.status}
            onChange={updateFilter('status')}
            aria-label="Filter by subscription status"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All subscription statuses' : status.replace('_', ' ')}
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
          Showing <span className="font-medium text-slate-700">{filteredBusinesses.length}</span> of{' '}
          <span className="font-medium text-slate-700">{businesses.length}</span> businesses
        </p>
      </div>

      <CreateBusinessWizard
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categoryTree={categoryTree}
        createBusiness={(payload) => adminApi.createBusiness(payload)}
        onCreated={() => {
          setAddOpen(false)
          load()
        }}
      />

      <div className="card table-scroll">
        <table className="data-table min-w-[1100px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Listing</th>
              <th className="px-4 py-3 font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 font-medium text-gray-700">Contact</th>
              <th className="px-4 py-3 font-medium text-gray-700">Rating</th>
              <th className="px-4 py-3 font-medium text-gray-700">Reviews</th>
              <th className="px-4 py-3 font-medium text-gray-700">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-700">Owner</th>
              <th className="px-4 py-3 font-medium text-gray-700">Joined</th>
              <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  {businesses.length === 0
                    ? 'No businesses found'
                    : 'No businesses match your filters'}
                </td>
              </tr>
            ) : (
              filteredBusinesses.map((biz) => (
                <tr key={biz.id} className="border-b border-gray-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link to={`/businesses/${biz.id}`} className="flex items-center gap-3">
                      <BusinessLogo logoUrl={biz.logo_url} name={biz.name} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 hover:text-primary-600">{biz.name}</p>
                        <p className="truncate text-xs text-slate-400">/{biz.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        listingStatusClass[biz.status || 'published'] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {biz.status || 'published'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{biz.category || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="space-y-0.5">
                      <p>{biz.email || '—'}</p>
                      <p>{biz.phone || '—'}</p>
                      {biz.website ? (
                        <a
                          href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          Website
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={biz.average_rating || 0} size="sm" showValue />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <Link
                      to={`/businesses/${biz.id}?tab=reviews`}
                      className="font-medium text-primary-600 hover:underline"
                      title="View reviews"
                    >
                      {biz.review_count ?? 0}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-800">
                      {biz.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <p className="font-medium text-slate-700">{biz.owner_name || '—'}</p>
                    <p>{biz.owner_email || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(biz.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/businesses/${biz.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-slate-600 hover:bg-slate-50"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(biz)}
                        disabled={deletingId === biz.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
