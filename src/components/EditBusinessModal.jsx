import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { adminApi } from '../services/api'
import BusinessLogo from './BusinessLogo'
import Button from './Button'
import LogoUploader from './LogoUploader'
import { resolveMediaUrl } from '../utils/constants'

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
  return {
    name: business?.name || '',
    mainCategoryId,
    category,
    description: business?.description || '',
    website: business?.website || '',
    email: business?.email || '',
    phone: business?.phone || '',
    address: business?.address || '',
    owner_name: business?.owner_name || '',
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
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        owner_name: form.owner_name.trim() || null,
        owner_email: form.owner_email.trim() || null,
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

              <div className="sm:col-span-2">
                <label htmlFor="edit-description" className="label-text">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  rows={4}
                  className="input-field mt-1"
                  value={form.description}
                  onChange={update('description')}
                />
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
                <label htmlFor="edit-phone" className="label-text">
                  Phone
                </label>
                <input
                  id="edit-phone"
                  className="input-field mt-1"
                  value={form.phone}
                  onChange={update('phone')}
                />
              </div>

              <div>
                <label htmlFor="edit-address" className="label-text">
                  Address / location
                </label>
                <input
                  id="edit-address"
                  className="input-field mt-1"
                  value={form.address}
                  onChange={update('address')}
                />
              </div>

              <div>
                <label htmlFor="edit-owner-name" className="label-text">
                  Owner name
                </label>
                <input
                  id="edit-owner-name"
                  className="input-field mt-1"
                  value={form.owner_name}
                  onChange={update('owner_name')}
                />
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
