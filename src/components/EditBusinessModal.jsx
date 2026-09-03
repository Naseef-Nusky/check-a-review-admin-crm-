import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { adminApi } from '../services/api'
import BusinessLogo from './BusinessLogo'
import Button from './Button'
import LogoUploader from './LogoUploader'
import { resolveMediaUrl } from '../utils/constants'
import { BUSINESS_LOCATIONS } from '../utils/locations'
import { PHONE_COUNTRY_CODES } from '../utils/phoneCountryCodes'

const REVENUE_OPTIONS = ['Under £500K', '£500K - £4.99 million', '£5 million - £24.99 million', '£25 million+']
const EMPLOYEE_OPTIONS = ['1-9', '10-49', '50-249', '250-999', '1000+']

function parseLabeledValue(text, label) {
  const match = String(text || '').match(new RegExp(`^${label}:\\s*(.*)$`, 'im'))
  const value = match?.[1]?.trim() || ''
  return value === '—' ? '' : value
}

function splitStoredAddress(address, description) {
  const raw = String(address || '').trim()
  const descCountry = parseLabeledValue(description, 'Location')
  const descAddress = parseLabeledValue(description, 'Address')
  const descPostal = parseLabeledValue(description, 'ZIP \\/ Postal code')

  if (descAddress || descPostal || descCountry) {
    return {
      location: descCountry || '',
      address: descAddress || raw,
      postalCode: descPostal,
    }
  }

  if (!raw) return { location: 'United Kingdom', address: '', postalCode: '' }

  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean)
  const last = parts[parts.length - 1] || ''
  const secondLast = parts[parts.length - 2] || ''
  const location = BUSINESS_LOCATIONS.includes(last) ? last : ''
  const postalCode = location && secondLast && !BUSINESS_LOCATIONS.includes(secondLast) ? secondLast : ''
  const streetParts = location
    ? parts.slice(0, postalCode ? -2 : -1)
    : parts

  return {
    location: location || 'United Kingdom',
    address: streetParts.join(', '),
    postalCode,
  }
}

function splitOwnerName(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

function splitPhone(phone) {
  const raw = String(phone || '').trim()
  const match = raw.match(/^(\+\d{1,4})\s*(.*)$/)
  if (!match) {
    return { phoneCode: '+44', phoneCountry: 'United Kingdom', phone: raw }
  }
  const phoneCode = match[1]
  const country = PHONE_COUNTRY_CODES.find((item) => item.code === phoneCode)
  return {
    phoneCode,
    phoneCountry: country?.name || 'United Kingdom',
    phone: match[2] || '',
  }
}

function SelectChevron() {
  return (
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  )
}

function resolveCategorySelection(categoryTree, categoryName) {
  const needle = String(categoryName || '').trim().toLowerCase()
  if (!needle) return { mainCategoryId: '', category: '' }

  for (const main of categoryTree) {
    for (const sub of main.subcategories || []) {
      if (String(sub.name).toLowerCase() === needle) {
        return { mainCategoryId: main.id, category: sub.name }
      }
    }
    if (String(main.name).toLowerCase() === needle) {
      return { mainCategoryId: main.id, category: main.name }
    }
  }

  return { mainCategoryId: '', category: categoryName || '' }
}

function buildForm(business, categoryTree) {
  const { mainCategoryId, category } = resolveCategorySelection(categoryTree, business?.category)
  const { location, address, postalCode } = splitStoredAddress(business?.address, business?.description)
  const { firstName, lastName } = splitOwnerName(business?.owner_name)
  const { phoneCode, phoneCountry, phone } = splitPhone(business?.phone)
  return {
    name: business?.name || '',
    location: location || 'United Kingdom',
    address,
    postalCode,
    mainCategoryId,
    category,
    website: business?.website || '',
    email: business?.email || '',
    phoneCode,
    phoneCountry,
    phone,
    jobTitle: parseLabeledValue(business?.description, 'Job title'),
    annualRevenue: parseLabeledValue(business?.description, 'Annual revenue'),
    employeeCount: parseLabeledValue(business?.description, 'Employees'),
    firstName,
    lastName,
    owner_email: business?.owner_email || '',
  }
}

function logoPreviewUrl(logoUrl) {
  if (!logoUrl) return ''
  const resolved = resolveMediaUrl(logoUrl)
  const separator = resolved.includes('?') ? '&' : '?'
  return `${resolved}${separator}t=${Date.now()}`
}

export default function EditBusinessModal({ open, business, categoryTree = [], onClose, onSaved }) {
  const [form, setForm] = useState(() => buildForm(business, categoryTree))
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState('')
  const [logoError, setLogoError] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentBusiness, setCurrentBusiness] = useState(business)

  useEffect(() => {
    if (!open || !business) return
    setCurrentBusiness(business)
    setForm(buildForm(business, categoryTree))
    setLogoFile(null)
    setLogoPreview(business.logo_url ? logoPreviewUrl(business.logo_url) : '')
    setError('')
    setLogoError('')
  }, [open, business, categoryTree])

  const subcategories = useMemo(() => {
    const main = categoryTree.find((item) => item.id === form.mainCategoryId)
    return main?.subcategories || []
  }, [categoryTree, form.mainCategoryId])

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const close = () => {
    if (saving || uploadingLogo) return
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    onClose?.()
  }

  const syncBusiness = (updated) => {
    setCurrentBusiness(updated)
    setLogoPreview(updated?.logo_url ? logoPreviewUrl(updated.logo_url) : '')
    onSaved?.(updated)
  }

  const handleLogoChange = async (file) => {
    if (!currentBusiness?.id) return

    if (!file) {
      setUploadingLogo(true)
      setLogoError('')
      try {
        const updated = await adminApi.removeBusinessLogo(currentBusiness.id)
        setLogoFile(null)
        if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
        setLogoPreview('')
        syncBusiness(updated)
      } catch (err) {
        setLogoError(err.message || 'Failed to remove logo')
      } finally {
        setUploadingLogo(false)
      }
      return
    }

    setUploadingLogo(true)
    setLogoError('')
    try {
      const updated = await adminApi.uploadBusinessLogo(currentBusiness.id, file)
      setLogoFile(null)
      if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
      setLogoPreview(updated?.logo_url ? logoPreviewUrl(updated.logo_url) : URL.createObjectURL(file))
      syncBusiness(updated)
    } catch (err) {
      setLogoError(err.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentBusiness?.id) return

    if (!form.name.trim()) {
      setError('Business name is required')
      return
    }
    if (!form.location) {
      setError('Country is required')
      return
    }
    if (!form.address.trim()) {
      setError('Address is required')
      return
    }
    if (!form.category.trim()) {
      setError('Category is required')
      return
    }
    if (form.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.owner_email)) {
      setError('Owner email must be valid')
      return
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Public email must be valid')
      return
    }

    setSaving(true)
    setError('')
    try {
      const ownerName = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' ')
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        website: form.website.trim() || null,
        email: form.email.trim() || null,
        phone: `${form.phoneCode} ${form.phone}`.trim() || null,
        address: [form.address.trim(), form.postalCode.trim(), form.location].filter(Boolean).join(', '),
        owner_name: ownerName || null,
        owner_email: form.owner_email.trim() || null,
        description: `Location: ${form.location}
Address: ${form.address.trim()}
ZIP / Postal code: ${form.postalCode.trim() || '—'}
Job title: ${form.jobTitle.trim() || '—'}
Annual revenue: ${form.annualRevenue || '—'}
Employees: ${form.employeeCount || '—'}
Contact: ${ownerName || '—'}`.trim(),
      }

      const updated = await adminApi.updateBusiness(currentBusiness.id, payload)
      syncBusiness(updated)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Failed to update business')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !currentBusiness) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-4 sm:py-10">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />

      <div className="relative z-10 flex max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <BusinessLogo logoUrl={currentBusiness.logo_url} name={currentBusiness.name} />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900">Edit business</h2>
                <p className="mt-1 truncate text-sm text-slate-500">{currentBusiness.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              disabled={saving || uploadingLogo}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div>
              <label className="label-text" htmlFor="edit-logo">
                Business logo
              </label>
              <LogoUploader
                valueFile={logoFile}
                previewUrl={logoPreview}
                onChange={handleLogoChange}
                onError={setLogoError}
                disabled={uploadingLogo || saving}
              />
              {logoError ? (
                <p className="mt-2 text-sm text-red-600">{logoError}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Logo uploads save immediately. You do not need to click Save changes for the logo.
                </p>
              )}
              {uploadingLogo ? <p className="mt-1 text-xs text-slate-400">Updating logo...</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="edit-name" className="label-text">
                  Business name
                </label>
                <input
                  id="edit-name"
                  required
                  className="input-field mt-1"
                  value={form.name}
                  onChange={update('name')}
                />
              </div>

              <div>
                <label htmlFor="edit-location" className="label-text">
                  Country
                </label>
                <div className="relative mt-1">
                  <select
                    id="edit-location"
                    className="input-field appearance-none pr-10"
                    value={form.location}
                    onChange={update('location')}
                  >
                    {BUSINESS_LOCATIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    {form.location && !BUSINESS_LOCATIONS.includes(form.location) ? (
                      <option value={form.location}>{form.location}</option>
                    ) : null}
                  </select>
                  <SelectChevron />
                </div>
              </div>

              <div>
                <label htmlFor="edit-postal-code" className="label-text">
                  ZIP / Postal code
                </label>
                <input
                  id="edit-postal-code"
                  className="input-field mt-1"
                  value={form.postalCode}
                  onChange={update('postalCode')}
                  placeholder="Optional"
                  autoComplete="postal-code"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="edit-address" className="label-text">
                  Address
                </label>
                <input
                  id="edit-address"
                  required
                  className="input-field mt-1"
                  value={form.address}
                  onChange={update('address')}
                  placeholder="Street address"
                  autoComplete="street-address"
                />
              </div>

              <div>
                <label htmlFor="edit-main-category" className="label-text">
                  Main category
                </label>
                <div className="relative mt-1">
                  <select
                    id="edit-main-category"
                    className="input-field appearance-none pr-10"
                    value={form.mainCategoryId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, mainCategoryId: e.target.value, category: '' }))
                    }
                  >
                    <option value="">Select main category</option>
                    {categoryTree.map((main) => (
                      <option key={main.id} value={main.id}>
                        {main.name}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </div>

              <div>
                <label htmlFor="edit-category" className="label-text">
                  Subcategory
                </label>
                <div className="relative mt-1">
                  <select
                    id="edit-category"
                    required
                    className="input-field appearance-none pr-10"
                    value={form.category}
                    onChange={update('category')}
                  >
                    <option value="">Select subcategory</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                    {form.category && !subcategories.some((sub) => sub.name === form.category) ? (
                      <option value={form.category}>{form.category}</option>
                    ) : null}
                  </select>
                  <SelectChevron />
                </div>
              </div>

              <div>
                <label htmlFor="edit-website" className="label-text">
                  Website
                </label>
                <input
                  id="edit-website"
                  className="input-field mt-1"
                  value={form.website}
                  onChange={update('website')}
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="label-text">
                  Public email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className="input-field mt-1"
                  value={form.email}
                  onChange={update('email')}
                />
              </div>

              <div>
                <label htmlFor="edit-job-title" className="label-text">
                  Job title
                </label>
                <input
                  id="edit-job-title"
                  className="input-field mt-1"
                  value={form.jobTitle}
                  onChange={update('jobTitle')}
                />
              </div>

              <div>
                <label htmlFor="edit-revenue" className="label-text">
                  Annual revenue
                </label>
                <div className="relative mt-1">
                  <select
                    id="edit-revenue"
                    className="input-field appearance-none pr-10"
                    value={form.annualRevenue}
                    onChange={update('annualRevenue')}
                  >
                    <option value="">Select annual revenue</option>
                    {REVENUE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    {form.annualRevenue && !REVENUE_OPTIONS.includes(form.annualRevenue) ? (
                      <option value={form.annualRevenue}>{form.annualRevenue}</option>
                    ) : null}
                  </select>
                  <SelectChevron />
                </div>
              </div>

              <div>
                <label htmlFor="edit-employees" className="label-text">
                  Number of employees
                </label>
                <div className="relative mt-1">
                  <select
                    id="edit-employees"
                    className="input-field appearance-none pr-10"
                    value={form.employeeCount}
                    onChange={update('employeeCount')}
                  >
                    <option value="">Select team size</option>
                    {EMPLOYEE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    {form.employeeCount && !EMPLOYEE_OPTIONS.includes(form.employeeCount) ? (
                      <option value={form.employeeCount}>{form.employeeCount}</option>
                    ) : null}
                  </select>
                  <SelectChevron />
                </div>
              </div>

              <div>
                <label htmlFor="edit-first-name" className="label-text">
                  Owner first name
                </label>
                <input
                  id="edit-first-name"
                  className="input-field mt-1"
                  value={form.firstName}
                  onChange={update('firstName')}
                />
              </div>

              <div>
                <label htmlFor="edit-last-name" className="label-text">
                  Owner last name
                </label>
                <input
                  id="edit-last-name"
                  className="input-field mt-1"
                  value={form.lastName}
                  onChange={update('lastName')}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="edit-phone" className="label-text">
                  Phone
                </label>
                <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)]">
                  <div className="relative">
                    <select
                      id="edit-phone-code"
                      className="input-field appearance-none pr-10"
                      value={`${form.phoneCode}|${form.phoneCountry || ''}`}
                      onChange={(e) => {
                        const [code, ...nameParts] = e.target.value.split('|')
                        setForm((prev) => ({
                          ...prev,
                          phoneCode: code,
                          phoneCountry: nameParts.join('|'),
                        }))
                      }}
                    >
                      {PHONE_COUNTRY_CODES.map((country) => (
                        <option key={`${country.name}-${country.code}`} value={`${country.code}|${country.name}`}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                    <SelectChevron />
                  </div>
                  <input
                    id="edit-phone"
                    type="tel"
                    className="input-field"
                    value={form.phone}
                    onChange={update('phone')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-owner-email" className="label-text">
                  Owner login email
                </label>
                <input
                  id="edit-owner-email"
                  type="email"
                  className="input-field mt-1"
                  value={form.owner_email}
                  onChange={update('owner_email')}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4 sm:px-6">
            <Button type="button" variant="secondary" onClick={close} disabled={saving || uploadingLogo}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploadingLogo}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
