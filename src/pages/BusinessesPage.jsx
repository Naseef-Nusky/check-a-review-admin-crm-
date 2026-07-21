import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate } from '../utils/format'
import StarRating from '../components/StarRating'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [categoryTree, setCategoryTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mainCategoryId: '',
    category: '',
    website: '',
    phone: '',
    description: '',
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

  const subcategoryOptions = useMemo(() => {
    const main = categoryTree.find((item) => item.id === form.mainCategoryId)
    return main?.subcategories || []
  }, [categoryTree, form.mainCategoryId])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleMainCategoryChange = (e) => {
    const mainCategoryId = e.target.value
    setForm((prev) => ({ ...prev, mainCategoryId, category: '' }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      await adminApi.createBusiness({
        name: form.name,
        email: form.email,
        password: form.password,
        category: form.category,
        website: form.website || null,
        phone: form.phone || null,
        description: form.description || null,
      })
      setAddOpen(false)
      setForm({
        name: '',
        email: '',
        password: '',
        mainCategoryId: '',
        category: '',
        website: '',
        phone: '',
        description: '',
      })
      load()
    } catch (err) {
      setSubmitError(err.message || 'Failed to create business')
    } finally {
      setSubmitting(false)
    }
  }

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

      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-10">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => {
              if (!submitting) setAddOpen(false)
            }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-[0_30px_90px_rgb(15_23_42/0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create a business</h2>
                <p className="mt-1 text-sm text-slate-500">This will create a business owner + business account.</p>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => {
                  if (!submitting) setAddOpen(false)
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="bizName">
                  Business name
                </label>
                <input
                  id="bizName"
                  required
                  className="input-field"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="e.g. Tech Solutions Inc"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ownerEmail">
                  Owner email
                </label>
                <input
                  id="ownerEmail"
                  required
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="owner@company.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ownerPassword">
                  Owner password
                </label>
                <input
                  id="ownerPassword"
                  required
                  type="password"
                  minLength={6}
                  className="input-field"
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Business@123"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="bizMainCategory">
                    Main category
                  </label>
                  <select
                    id="bizMainCategory"
                    required
                    className="input-field"
                    value={form.mainCategoryId}
                    onChange={handleMainCategoryChange}
                  >
                    <option value="">Select main category</option>
                    {categoryTree.map((main) => (
                      <option key={main.id} value={main.id}>
                        {main.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="bizCategory">
                    Subcategory
                  </label>
                  <select
                    id="bizCategory"
                    required
                    className="input-field"
                    value={form.category}
                    onChange={handleChange('category')}
                    disabled={!form.mainCategoryId}
                  >
                    <option value="">Select subcategory</option>
                    {subcategoryOptions.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {categoryTree.length === 0 && (
                <p className="text-sm text-amber-700">
                  No categories found. Seed categories from the Categories tab first.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="bizWebsite">
                    Website (optional)
                  </label>
                  <input
                    id="bizWebsite"
                    className="input-field"
                    value={form.website}
                    onChange={handleChange('website')}
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="bizPhone">
                    Phone (optional)
                  </label>
                  <input
                    id="bizPhone"
                    className="input-field"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    placeholder="+1 555 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="bizDesc">
                  Description (optional)
                </label>
                <textarea
                  id="bizDesc"
                  className="input-field min-h-[110px] resize-none"
                  value={form.description}
                  onChange={handleChange('description')}
                  placeholder="Short company description"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => {
                    if (!submitting) setAddOpen(false)
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 font-medium text-gray-700">Rating</th>
              <th className="px-4 py-3 font-medium text-gray-700">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-700">Owner</th>
              <th className="px-4 py-3 font-medium text-gray-700">Joined</th>
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No businesses found
                </td>
              </tr>
            ) : (
              businesses.map((biz) => (
                <tr key={biz.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{biz.name}</td>
                  <td className="px-4 py-3 text-gray-500">{biz.category || '—'}</td>
                  <td className="px-4 py-3">
                    <StarRating rating={biz.average_rating || 0} size="sm" showValue />
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-800">
                      {biz.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{biz.owner_email}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(biz.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
