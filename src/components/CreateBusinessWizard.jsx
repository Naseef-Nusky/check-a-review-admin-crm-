import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, X } from 'lucide-react'
import PasswordInput from './PasswordInput'
import LogoUploader from './LogoUploader'
import { BUSINESS_LOCATIONS } from '../utils/locations'
import { PHONE_COUNTRY_CODES } from '../utils/phoneCountryCodes'

const STEPS = ['Business details', 'Additional details', 'Personal details', 'Activate account']

const revenueOptions = ['Under £500K', '£500K - £4.99 million', '£5 million - £24.99 million', '£25 million+']
const employeeOptions = ['1-9', '10-49', '50-249', '250-999', '1000+']

const emptyForm = {
  location: 'United Kingdom',
  name: '',
  website: '',
  mainCategoryId: '',
  category: '',
  jobTitle: '',
  annualRevenue: '',
  employeeCount: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneCode: '+44',
  phoneCountry: 'United Kingdom',
  phone: '',
  password: '',
}

function SelectChevron() {
  return (
    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  )
}

function ProgressSteps({ step }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-slate-500">
      {STEPS.map((label, index) => {
        const complete = index < step
        const current = index === step
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                complete
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : current
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-300 bg-white text-slate-500'
              }`}
            >
              {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={`hidden sm:inline ${current ? 'font-semibold text-slate-900' : ''}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function normalizeWebsite(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export default function CreateBusinessWizard({
  open,
  onClose,
  onCreated,
  categoryTree = [],
  createBusiness,
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const subcategories = useMemo(() => {
    const main = categoryTree.find((item) => item.id === form.mainCategoryId)
    return main?.subcategories || []
  }, [categoryTree, form.mainCategoryId])

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleLogoChange = (file) => {
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    if (!file) {
      setLogoFile(null)
      setLogoPreview('')
      return
    }
    setError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const reset = () => {
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    setStep(0)
    setForm(emptyForm)
    setLogoFile(null)
    setLogoPreview('')
    setError('')
    setSubmitting(false)
  }

  const close = () => {
    if (submitting) return
    reset()
    onClose?.()
  }

  const validateStep = () => {
    if (step === 0) {
      if (!form.location || !form.name || !form.website || !form.mainCategoryId || !form.category) {
        return 'Please complete all business details fields.'
      }
    }
    if (step === 1) {
      if (!form.jobTitle || !form.annualRevenue || !form.employeeCount) {
        return 'Please complete the additional details before continuing.'
      }
    }
    if (step === 2) {
      if (!form.firstName || !form.lastName || !form.phone) {
        return 'Please enter the owner personal details.'
      }
    }
    if (step === 3) {
      if (!form.email || !form.password) {
        return 'Please enter owner email and password.'
      }
      if (form.password.length < 8) {
        return 'Password must be at least 8 characters.'
      }
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateStep()
    if (validationError) {
      setError(validationError)
      return
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }

    setSubmitting(true)
    try {
      await createBusiness(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          category: form.category,
          website: normalizeWebsite(form.website),
          phone: `${form.phoneCode} ${form.phone}`.trim() || null,
          address: form.location || null,
          description: `Location: ${form.location}
Job title: ${form.jobTitle}
Annual revenue: ${form.annualRevenue}
Employees: ${form.employeeCount}
Contact: ${form.firstName} ${form.lastName}`.trim(),
        },
        logoFile,
      )
      reset()
      onCreated?.()
    } catch (err) {
      setError(err.message || 'Failed to create business')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const titles = [
    "First, let's add the business details",
    'More details can help customize the business profile',
    'Now, add the owner’s personal details',
    'Create login credentials to activate the account',
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:px-4 sm:py-8">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />

      <div className="relative flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-white shadow-[0_30px_90px_rgb(15_23_42/0.25)] sm:max-h-[92vh] sm:rounded-2xl">
        <div className="border-b border-border px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create a business</h2>
              <p className="mt-1 text-sm text-slate-500">Same 4-step flow as the business portal signup</p>
            </div>
            <button
              type="button"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              onClick={close}
              aria-label="Close"
              disabled={submitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4">
            <ProgressSteps step={step} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <h3 className="text-center text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {titles[step]}
            </h3>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 space-y-5">
              {step === 0 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmLocation">
                      Business location
                    </label>
                    <div className="relative">
                      <select
                        id="crmLocation"
                        className="input-field appearance-none pr-10"
                        value={form.location}
                        onChange={update('location')}
                      >
                        {BUSINESS_LOCATIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                  </div>

                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmBizName">
                      Business name
                    </label>
                    <input
                      id="crmBizName"
                      className="input-field"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Your company name"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      This helps customers find and trust the business.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-text text-slate-700" htmlFor="crmLogo">
                      Business logo
                    </label>
                    <LogoUploader
                      valueFile={logoFile}
                      previewUrl={logoPreview}
                      onChange={handleLogoChange}
                      onError={setError}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmWebsite">
                      Business website
                    </label>
                    <input
                      id="crmWebsite"
                      type="text"
                      className="input-field"
                      value={form.website}
                      onChange={update('website')}
                      placeholder="yourbusiness.com"
                      inputMode="url"
                      autoComplete="url"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      Enter a live website address, e.g. yourbusiness.com. DNS is checked before creating the listing.
                    </p>
                  </div>

                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmMainCat">
                      Main category
                    </label>
                    <div className="relative">
                      <select
                        id="crmMainCat"
                        className="input-field appearance-none pr-10"
                        value={form.mainCategoryId}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            mainCategoryId: e.target.value,
                            category: '',
                          }))
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

                  <div className="sm:col-span-2">
                    <label className="label-text text-slate-700" htmlFor="crmSubCat">
                      Subcategory
                    </label>
                    <div className="relative">
                      <select
                        id="crmSubCat"
                        className="input-field appearance-none pr-10"
                        value={form.category}
                        onChange={update('category')}
                        disabled={!form.mainCategoryId}
                      >
                        <option value="">Select subcategory</option>
                        {subcategories.map((sub) => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                  </div>

                  {categoryTree.length === 0 && (
                    <p className="sm:col-span-2 text-sm text-amber-700">
                      No categories found. Seed categories from the Categories tab first.
                    </p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label-text text-slate-700" htmlFor="crmJobTitle">
                      Job title
                    </label>
                    <input
                      id="crmJobTitle"
                      className="input-field"
                      value={form.jobTitle}
                      onChange={update('jobTitle')}
                      placeholder="Marketing manager"
                    />
                  </div>
                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmRevenue">
                      Annual revenue
                    </label>
                    <div className="relative">
                      <select
                        id="crmRevenue"
                        className="input-field appearance-none pr-10"
                        value={form.annualRevenue}
                        onChange={update('annualRevenue')}
                      >
                        <option value="">Select annual revenue</option>
                        {revenueOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                  </div>
                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmEmployees">
                      Number of employees
                    </label>
                    <div className="relative">
                      <select
                        id="crmEmployees"
                        className="input-field appearance-none pr-10"
                        value={form.employeeCount}
                        onChange={update('employeeCount')}
                      >
                        <option value="">Select team size</option>
                        {employeeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmFirstName">
                      First name
                    </label>
                    <input
                      id="crmFirstName"
                      className="input-field"
                      value={form.firstName}
                      onChange={update('firstName')}
                    />
                  </div>
                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmLastName">
                      Last name
                    </label>
                    <input
                      id="crmLastName"
                      className="input-field"
                      value={form.lastName}
                      onChange={update('lastName')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label-text text-slate-700" htmlFor="crmPhone">
                      Phone number
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)]">
                      <div className="relative">
                        <select
                          id="crmPhoneCode"
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
                        id="crmPhone"
                        type="tel"
                        className="input-field"
                        value={form.phone}
                        onChange={update('phone')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label-text text-slate-700" htmlFor="crmEmail">
                      Email address
                    </label>
                    <input
                      id="crmEmail"
                      type="email"
                      className="input-field"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="name@yourbusiness.com"
                    />
                    <p className="mt-2 text-sm text-slate-500">
                      Use an email that matches the website domain when possible. This becomes the owner login.
                    </p>
                  </div>
                  <div>
                    <PasswordInput
                      id="crmPassword"
                      label="Create password"
                      minLength={8}
                      value={form.password}
                      onChange={update('password')}
                    />
                  </div>
                  <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    CRM-created businesses are published immediately and the owner email is marked verified — no
                    activation email is required.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
            {step > 0 ? (
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => {
                  setError('')
                  setStep((s) => s - 1)
                }}
                disabled={submitting}
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                onClick={close}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex min-w-24 items-center justify-center rounded-full bg-primary-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting
                ? 'Creating...'
                : step === STEPS.length - 1
                  ? 'Create business'
                  : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
