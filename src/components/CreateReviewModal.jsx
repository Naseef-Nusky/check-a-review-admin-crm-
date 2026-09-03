import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'
import { adminApi } from '../services/api'
import Button from './Button'
import BusinessSearchSelect from './BusinessSearchSelect'
import CustomerSearchSelect from './CustomerSearchSelect'
import PasswordInput from './PasswordInput'

const emptyForm = {
  businessId: '',
  userId: '',
  rating: 5,
  title: '',
  content: '',
  reviewDate: '',
  createCustomer: false,
  customerName: '',
  customerEmail: '',
  customerPassword: '',
}

export default function CreateReviewModal({
  open,
  onClose,
  onCreated,
  initialBusinessId = '',
  lockBusiness = false,
}) {
  const [form, setForm] = useState({ ...emptyForm, businessId: initialBusinessId || '' })
  const [businesses, setBusinesses] = useState([])
  const [users, setUsers] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    setForm({ ...emptyForm, businessId: initialBusinessId || '', reviewDate: today })
    setError('')
    setLoadingOptions(true)

    Promise.all([adminApi.getBusinesses(), adminApi.getUsers()])
      .then(([businessList, userList]) => {
        setBusinesses(Array.isArray(businessList) ? businessList : [])
        setUsers(Array.isArray(userList) ? userList : [])
      })
      .catch((err) => setError(err.message || 'Failed to load businesses and users'))
      .finally(() => setLoadingOptions(false))
  }, [open, initialBusinessId])

  if (!open) return null

  const close = () => {
    if (saving) return
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.businessId) {
      setError('Select a business')
      return
    }
    if (!form.createCustomer && !form.userId) {
      setError('Select a customer or create a new one')
      return
    }
    if (String(form.content || '').trim().length < 10) {
      setError('Review content must be at least 10 characters')
      return
    }

    setSaving(true)
    try {
      let userId = form.userId
      if (form.createCustomer) {
        if (form.customerPassword.length < 8) {
          setError('Customer password must be at least 8 characters')
          setSaving(false)
          return
        }
        const created = await adminApi.createUser({
          name: form.customerName.trim(),
          email: form.customerEmail.trim(),
          password: form.customerPassword,
        })
        userId = created.id
      }

      const review = await adminApi.createReview({
        businessId: form.businessId,
        userId,
        rating: Number(form.rating),
        title: form.title.trim(),
        content: form.content.trim(),
        status: 'published',
        createdAt: form.reviewDate ? `${form.reviewDate}T12:00:00.000Z` : undefined,
      })

      onCreated?.(review)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not create review')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-4 sm:py-10">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
      <div className="relative z-10 max-h-[96vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Add review</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Create a published review for a business on behalf of a customer account.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loadingOptions ? (
            <p className="text-sm text-slate-500">Loading businesses and customers…</p>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="crm-review-business">
                  Business
                </label>
                {lockBusiness && form.businessId ? (
                  <input
                    id="crm-review-business"
                    className="input-field bg-slate-50"
                    disabled
                    value={
                      businesses.find((b) => String(b.id) === String(form.businessId))?.name ||
                      'Selected business'
                    }
                  />
                ) : (
                  <BusinessSearchSelect
                    id="crm-review-business"
                    businesses={businesses}
                    value={form.businessId}
                    onChange={(businessId) => setForm((f) => ({ ...f, businessId }))}
                  />
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="customerMode"
                      checked={!form.createCustomer}
                      onChange={() => setForm((f) => ({ ...f, createCustomer: false }))}
                    />
                    Existing customer
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="customerMode"
                      checked={form.createCustomer}
                      onChange={() => setForm((f) => ({ ...f, createCustomer: true, userId: '' }))}
                    />
                    Create new customer
                  </label>
                </div>
              </div>

              {!form.createCustomer ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="crm-review-customer">
                    Customer
                  </label>
                  <CustomerSearchSelect
                    id="crm-review-customer"
                    users={users}
                    value={form.userId}
                    onChange={(userId) => setForm((f) => ({ ...f, userId }))}
                  />
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="crm-new-customer-name">
                      Full name
                    </label>
                    <input
                      id="crm-new-customer-name"
                      required
                      className="input-field"
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="crm-new-customer-email">
                      Email
                    </label>
                    <input
                      id="crm-new-customer-email"
                      type="email"
                      required
                      className="input-field"
                      value={form.customerEmail}
                      onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    />
                  </div>
                  <PasswordInput
                    id="crm-new-customer-password"
                    label="Password"
                    required
                    minLength={8}
                    value={form.customerPassword}
                    onChange={(e) => setForm((f) => ({ ...f, customerPassword: e.target.value }))}
                    labelClassName="mb-1.5 block text-sm font-medium text-gray-700"
                  />
                </div>
              )}

              <div>
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: value }))}
                      className="rounded-lg p-1 hover:bg-amber-50"
                      aria-label={`${value} stars`}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          value <= form.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-200'
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-slate-600">{form.rating}/5</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="crm-review-title">
                  Title
                </label>
                <input
                  id="crm-review-title"
                  required
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="crm-review-content">
                  Review
                </label>
                <textarea
                  id="crm-review-content"
                  required
                  minLength={10}
                  rows={5}
                  className="input-field"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="At least 10 characters"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="crm-review-date">
                  Review date
                </label>
                <input
                  id="crm-review-date"
                  type="date"
                  required
                  className="input-field"
                  value={form.reviewDate}
                  onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))}
                />
              </div>

              <p className="text-xs text-slate-500">
                Reviews created from CRM are published immediately (no AI pending queue).
              </p>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loadingOptions}>
              {saving ? 'Creating...' : 'Add review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
