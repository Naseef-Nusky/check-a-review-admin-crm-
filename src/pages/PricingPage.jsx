import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const emptyStep = { title: '', description: '' }
const emptyPlanFeature = { label: '', included: true }
const emptyPlan = {
  key: '',
  name: '',
  price: '',
  period: '/month',
  description: '',
  badge: '',
  ctaLabel: '',
  highlighted: false,
  users: '1',
  domains: '1',
  features: [{ ...emptyPlanFeature }],
}
const emptyComparisonRow = {
  label: '',
  values: { starter: false, plus: false, premium: false, enterprise: false },
}
const emptyComparisonSection = {
  title: '',
  rows: [{ ...emptyComparisonRow }],
}
const emptyFaq = { question: '', answer: '' }

const PLAN_KEYS = ['starter', 'plus', 'premium', 'enterprise']
const DEFAULT_PLAN_LIMITS = {
  starter: { users: '1', domains: '1' },
  plus: { users: '3', domains: '3' },
  premium: { users: '10', domains: 'Unlimited' },
  enterprise: { users: '1000', domains: 'Unlimited' },
}
const LIMIT_FEATURES = [
  { label: 'Users', field: 'users' },
  { label: 'Domains', field: 'domains' },
]

function isLimitFeatureLabel(label) {
  const normalized = String(label || '')
    .trim()
    .toLowerCase()
  return LIMIT_FEATURES.some((item) => item.label.toLowerCase() === normalized)
}

function toCheckValue(value) {
  if (typeof value === 'boolean') return value
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  if (['true', 'yes', 'included', '✓', 'check', 'checked'].includes(normalized)) return true
  return false
}

function normalizeComparisonValue(value) {
  if (typeof value === 'boolean') return value
  if (value == null) return false
  const text = String(value).trim()
  if (!text) return false
  const normalized = text.toLowerCase()
  if (['true', 'yes', 'included', '✓', 'check', 'checked'].includes(normalized)) return true
  if (['false', 'no', 'not included', '—', '-', 'x'].includes(normalized)) return false
  return text
}

function normalizePlanFeature(feature) {
  if (typeof feature === 'string') {
    return { label: feature, included: true }
  }
  return {
    label: feature?.label || '',
    included: feature?.included !== false && toCheckValue(feature?.included ?? true),
  }
}

function findComparisonValue(sections, planKey, label) {
  const match = String(label).toLowerCase()
  for (const section of Array.isArray(sections) ? sections : []) {
    for (const row of Array.isArray(section?.rows) ? section.rows : []) {
      if (String(row?.label || '').trim().toLowerCase() === match) {
        return row?.values?.[planKey]
      }
    }
  }
  return undefined
}

function normalizeComparisonSections(sections, plans = []) {
  const source = Array.isArray(sections) ? sections : []
  const planKeys = (Array.isArray(plans) ? plans : [])
    .map((plan) => String(plan?.key || '').trim())
    .filter(Boolean)
  const keys = planKeys.length ? planKeys : PLAN_KEYS

  let rows = source
    .flatMap((section) => (Array.isArray(section?.rows) ? section.rows : []))
    .map((row) => ({
      label: row?.label || '',
      values: keys.reduce((acc, key) => {
        acc[key] = normalizeComparisonValue(row?.values?.[key])
        return acc
      }, {}),
    }))

  for (const { label, field } of LIMIT_FEATURES) {
    const existingIndex = rows.findIndex((row) => String(row.label).trim().toLowerCase() === label.toLowerCase())
    const values = keys.reduce((acc, key) => {
      const plan = (plans || []).find((item) => item.key === key)
      const fromPlan = plan?.[field]
      const fromRow = existingIndex >= 0 ? rows[existingIndex].values?.[key] : undefined
      const fallback = DEFAULT_PLAN_LIMITS[key]?.[field] || '1'
      acc[key] = limitText(fromPlan || fromRow, fallback)
      return acc
    }, {})

    if (existingIndex >= 0) {
      rows[existingIndex] = { label, values }
    } else {
      rows = [{ label, values }, ...rows]
    }
  }

  return [
    {
      title: 'Features',
      rows: rows.length ? rows : [{ ...emptyComparisonRow, values: { ...emptyComparisonRow.values } }],
    },
  ]
}

function defaultLimitsForPlan(planKey) {
  return DEFAULT_PLAN_LIMITS[planKey] || { users: '1', domains: '1' }
}

function limitText(value, fallback) {
  if (typeof value === 'boolean') return fallback
  const text = String(value ?? '').trim()
  if (!text || ['true', 'false', 'yes', 'no', '✓', '—', '-'].includes(text.toLowerCase())) {
    return fallback
  }
  return text
}

function normalizePricing(data) {
  const rawPlans =
    Array.isArray(data?.plans) && data.plans.length
      ? data.plans
      : PLAN_KEYS.map((key) => ({ ...emptyPlan, key, name: key, ...defaultLimitsForPlan(key) }))

  const plans = rawPlans.map((plan) => {
    const defaults = defaultLimitsForPlan(plan.key)
    const users = limitText(
      plan.users || findComparisonValue(data?.comparisonSections, plan.key, 'Users'),
      defaults.users,
    )
    const domains = limitText(
      plan.domains || findComparisonValue(data?.comparisonSections, plan.key, 'Domains'),
      defaults.domains,
    )

    return {
      ...emptyPlan,
      ...plan,
      users,
      domains,
      features:
        Array.isArray(plan?.features) && plan.features.length
          ? plan.features.map(normalizePlanFeature)
          : [{ ...emptyPlanFeature }],
    }
  })

  return {
    heroTitle: data?.heroTitle || '',
    heroSubtitle: data?.heroSubtitle || '',
    billingNote: data?.billingNote || '',
    trustBadge: data?.trustBadge || '',
    logos: Array.isArray(data?.logos) && data.logos.length ? data.logos : [''],
    steps: Array.isArray(data?.steps) && data.steps.length ? data.steps : [{ ...emptyStep }],
    plans,
    comparisonSections: normalizeComparisonSections(data?.comparisonSections, plans),
    faqs: Array.isArray(data?.faqs) && data.faqs.length ? data.faqs : [{ ...emptyFaq }],
  }
}

function syncLimitRowsFromPlans(rows, plans) {
  let nextRows = Array.isArray(rows) ? [...rows] : []
  const planKeys = plans.map((plan) => String(plan.key || '').trim()).filter(Boolean)

  for (const { label, field } of LIMIT_FEATURES) {
    const values = planKeys.reduce((acc, key) => {
      const plan = plans.find((item) => item.key === key)
      acc[key] = String(plan?.[field] || '').trim() || defaultLimitsForPlan(key)[field]
      return acc
    }, {})
    const index = nextRows.findIndex((row) => String(row.label).trim().toLowerCase() === label.toLowerCase())
    if (index >= 0) {
      nextRows[index] = { label, values: { ...nextRows[index].values, ...values } }
    } else {
      nextRows = [{ label, values }, ...nextRows]
    }
  }

  return nextRows
}

function comparisonValueToIncluded(value) {
  if (typeof value === 'boolean') return value
  const text = String(value ?? '').trim()
  if (!text) return false
  const normalized = text.toLowerCase()
  if (['false', 'no', 'not included', '—', '-', '0', 'x'].includes(normalized)) return false
  return true
}

function SectionCard({ title, description, children }) {
  return (
    <section className="card space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function PricingPage() {
  const [pricing, setPricing] = useState(normalizePricing())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getPricing()
      .then((data) => setPricing(normalizePricing(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const updateListItem = (field, index, value) => {
    setPricing((prev) => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }))
  }

  const updatePlan = (index, field, value) => {
    updateListItem('plans', index, { ...pricing.plans[index], [field]: value })
  }

  const updateComparisonSection = (sectionIndex, field, value) => {
    updateListItem('comparisonSections', sectionIndex, {
      ...pricing.comparisonSections[sectionIndex],
      [field]: value,
    })
  }

  const updateComparisonRow = (sectionIndex, rowIndex, field, value) => {
    const section = pricing.comparisonSections[sectionIndex]
    const rows = section.rows.map((row, index) => (index === rowIndex ? { ...row, [field]: value } : row))
    updateComparisonSection(sectionIndex, 'rows', rows)
  }

  const updateComparisonValue = (sectionIndex, rowIndex, planKey, value) => {
    const section = pricing.comparisonSections[sectionIndex]
    const rows = section.rows.map((row, index) =>
      index === rowIndex ? { ...row, values: { ...row.values, [planKey]: value } } : row,
    )
    updateComparisonSection(sectionIndex, 'rows', rows)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const plans = pricing.plans.map((plan) => ({
        ...plan,
        users: String(plan.users || '').trim() || defaultLimitsForPlan(plan.key).users,
        domains: String(plan.domains || '').trim() || defaultLimitsForPlan(plan.key).domains,
      }))
      const comparisonRows = syncLimitRowsFromPlans(pricing.comparisonSections[0]?.rows || [], plans)
        .filter((row) => String(row.label || '').trim())
        .map((row) => ({
          label: row.label.trim(),
          values: Object.fromEntries(
            Object.entries(row.values || {}).map(([key, value]) => [key, normalizeComparisonValue(value)]),
          ),
        }))

      await adminApi.updatePricing({
        ...pricing,
        logos: pricing.logos.map((item) => item.trim()).filter(Boolean),
        steps: pricing.steps.filter((item) => item.title.trim() || item.description.trim()),
        plans: plans.map((plan) => ({
          ...plan,
          features: comparisonRows
            .filter((row) => !isLimitFeatureLabel(row.label))
            .map((row) => ({
              label: row.label,
              included: comparisonValueToIncluded(row.values?.[plan.key]),
            })),
        })),
        comparisonSections: [
          {
            title: 'Features',
            rows: comparisonRows,
          },
        ].filter((section) => section.rows.length),
        faqs: pricing.faqs.filter((item) => item.question.trim() || item.answer.trim()),
      })
      setMessage('Pricing page content saved successfully.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error && !pricing.plans?.length) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        kicker="Business website"
        title="Pricing CMS"
        description="Manage the public pricing page. Plan names, prices, and limits now sync from Billing plans automatically."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? <ErrorMessage message={error} onRetry={load} /> : null}
        {message ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        <SectionCard
          title="Comparison table"
          description="Manage plan comparison rows here. Plan names, prices, and limits come from Billing plans; this table controls feature visibility."
        >
          {(() => {
            const planColumns = (pricing.plans || [])
              .map((plan) => ({
                key: String(plan.key || '').trim(),
                name: plan.name || plan.key || 'Plan',
              }))
              .filter((plan) => plan.key)
            const columns = planColumns.length
              ? planColumns
              : PLAN_KEYS.map((key) => ({ key, name: key }))
            const rows = pricing.comparisonSections[0]?.rows || []

            return (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="min-w-[52rem] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="min-w-[160px] px-3 py-3 text-left font-semibold sm:min-w-[220px] sm:px-4">Feature</th>
                        {columns.map((plan) => (
                          <th key={plan.key} className="min-w-[110px] px-3 py-3 text-center font-semibold capitalize">
                            {plan.name}
                          </th>
                        ))}
                        <th className="w-14 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => {
                        const limitRow = isLimitFeatureLabel(row.label)
                        return (
                          <tr key={`feature-row-${rowIndex}`} className="border-t border-border">
                            <td className="px-3 py-2">
                              <input
                                className="input-field"
                                value={row.label}
                                onChange={(e) => updateComparisonRow(0, rowIndex, 'label', e.target.value)}
                                placeholder="e.g. Review widget"
                                disabled={limitRow}
                              />
                            </td>
                            {columns.map((planColumn) => {
                              const value = row.values?.[planColumn.key]
                              if (limitRow) {
                                const planIndex = pricing.plans.findIndex((item) => item.key === planColumn.key)
                                const field = String(row.label).trim().toLowerCase() === 'domains' ? 'domains' : 'users'
                                const current = planIndex >= 0 ? pricing.plans[planIndex][field] : value
                                const unlimited =
                                  current == null ||
                                  !Number.isFinite(Number(current)) ||
                                  ['unlimited', 'all', 'inf'].includes(String(current).trim().toLowerCase())
                                const numeric = unlimited ? '' : String(current).trim()
                                const presets = field === 'domains' ? ['1', '3'] : ['1', '3', '10', '1000']
                                const options = [...presets]
                                if (numeric && !options.includes(numeric)) options.push(numeric)
                                return (
                                  <td key={`${rowIndex}-${planColumn.key}`} className="px-3 py-2 text-center">
                                    <div className="flex gap-2">
                                      <select
                                        className="input-field text-center"
                                        value={unlimited ? 'unlimited' : numeric}
                                        onChange={(e) => {
                                          if (planIndex >= 0) updatePlan(planIndex, field, e.target.value)
                                        }}
                                      >
                                        {options.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                        <option value="unlimited">Unlimited</option>
                                      </select>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="input-field w-20 text-center"
                                        disabled={unlimited}
                                        placeholder="No."
                                        value={numeric}
                                        onChange={(e) => {
                                          if (planIndex >= 0) updatePlan(planIndex, field, e.target.value)
                                        }}
                                      />
                                    </div>
                                  </td>
                                )
                              }

                              const checked = Boolean(value)
                              return (
                                <td key={`${rowIndex}-${planColumn.key}`} className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    aria-label={`${checked ? 'Disable' : 'Enable'} ${planColumn.name} for this feature`}
                                    onClick={() => updateComparisonValue(0, rowIndex, planColumn.key, !checked)}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-base font-semibold transition ${
                                      checked
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        : 'border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:text-slate-400'
                                    }`}
                                  >
                                    {checked ? '✓' : '—'}
                                  </button>
                                </td>
                              )
                            })}
                            <td className="px-2 py-2 text-center">
                              <Button
                                variant="secondary"
                                type="button"
                                onClick={() =>
                                  updateComparisonSection(
                                    0,
                                    'rows',
                                    rows.filter((_, index) => index !== rowIndex),
                                  )
                                }
                                disabled={rows.length === 1 || limitRow}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )
          })()}
        </SectionCard>

        <div className="flex justify-stretch sm:justify-end">
          <Button type="submit" size="lg" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Saving pricing page...' : 'Save pricing page'}
          </Button>
        </div>
      </form>
    </div>
  )
}
