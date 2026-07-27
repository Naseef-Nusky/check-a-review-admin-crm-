import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const emptyStep = { title: '', description: '' }
const emptyPlan = {
  key: '',
  name: '',
  price: '',
  period: '/month',
  description: '',
  badge: '',
  ctaLabel: '',
  highlighted: false,
  features: [''],
}
const emptyComparisonRow = {
  label: '',
  values: { starter: '', plus: '', premium: '', enterprise: '' },
}
const emptyComparisonSection = {
  title: '',
  rows: [{ ...emptyComparisonRow }],
}
const emptyFaq = { question: '', answer: '' }

function normalizePricing(data) {
  return {
    heroTitle: data?.heroTitle || '',
    heroSubtitle: data?.heroSubtitle || '',
    billingNote: data?.billingNote || '',
    trustBadge: data?.trustBadge || '',
    logos: Array.isArray(data?.logos) && data.logos.length ? data.logos : [''],
    steps: Array.isArray(data?.steps) && data.steps.length ? data.steps : [{ ...emptyStep }],
    plans: Array.isArray(data?.plans) && data.plans.length ? data.plans : [{ ...emptyPlan }],
    comparisonSections:
      Array.isArray(data?.comparisonSections) && data.comparisonSections.length
        ? data.comparisonSections
        : [{ ...emptyComparisonSection }],
    faqs: Array.isArray(data?.faqs) && data.faqs.length ? data.faqs : [{ ...emptyFaq }],
  }
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

  const setField = (field, value) => {
    setPricing((prev) => ({ ...prev, [field]: value }))
  }

  const updateListItem = (field, index, value) => {
    setPricing((prev) => ({
      ...prev,
      [field]: prev[field].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }))
  }

  const addListItem = (field, value) => {
    setPricing((prev) => ({ ...prev, [field]: [...prev[field], value] }))
  }

  const removeListItem = (field, index) => {
    setPricing((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const updatePlan = (index, field, value) => {
    updateListItem('plans', index, { ...pricing.plans[index], [field]: value })
  }

  const updatePlanFeature = (planIndex, featureIndex, value) => {
    const plan = pricing.plans[planIndex]
    const features = plan.features.map((feature, index) => (index === featureIndex ? value : feature))
    updatePlan(planIndex, 'features', features)
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
      await adminApi.updatePricing({
        ...pricing,
        logos: pricing.logos.map((item) => item.trim()).filter(Boolean),
        steps: pricing.steps.filter((item) => item.title.trim() || item.description.trim()),
        plans: pricing.plans.map((plan) => ({
          ...plan,
          features: plan.features.map((item) => item.trim()).filter(Boolean),
        })),
        comparisonSections: pricing.comparisonSections
          .map((section) => ({
            ...section,
            rows: section.rows.filter((row) => row.label.trim()),
          }))
          .filter((section) => section.title.trim() || section.rows.length),
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
  if (error && !pricing.heroTitle) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        kicker="Business website"
        title="Pricing CMS"
        description="Manage the pricing page content shown on the public business website."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? <ErrorMessage message={error} onRetry={load} /> : null}
        {message ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        <SectionCard title="Hero copy" description="Top section headline, subtitle, and supporting trust message.">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className="label-text text-slate-700">Hero title</label>
              <input
                className="input-field"
                value={pricing.heroTitle}
                onChange={(e) => setField('heroTitle', e.target.value)}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="label-text text-slate-700">Hero subtitle</label>
              <textarea
                className="input-field min-h-28"
                value={pricing.heroSubtitle}
                onChange={(e) => setField('heroSubtitle', e.target.value)}
              />
            </div>
            <div>
              <label className="label-text text-slate-700">Billing note</label>
              <textarea
                className="input-field min-h-28"
                value={pricing.billingNote}
                onChange={(e) => setField('billingNote', e.target.value)}
              />
            </div>
            <div>
              <label className="label-text text-slate-700">Trust badge</label>
              <input
                className="input-field"
                value={pricing.trustBadge}
                onChange={(e) => setField('trustBadge', e.target.value)}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Trusted-by logos" description="Short brand names shown in the logo strip.">
          <div className="space-y-3">
            {pricing.logos.map((logo, index) => (
              <div key={`logo-${index}`} className="flex gap-3">
                <input
                  className="input-field"
                  value={logo}
                  onChange={(e) => updateListItem('logos', index, e.target.value)}
                  placeholder="HubSpot"
                />
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => removeListItem('logos', index)}
                  disabled={pricing.logos.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => addListItem('logos', '')}>
              <Plus className="h-4 w-4" />
              Add logo
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="How it works" description="The short four-step explanation under the logo strip.">
          <div className="space-y-4">
            {pricing.steps.map((step, index) => (
              <div key={`step-${index}`} className="rounded-2xl border border-border p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_2fr_auto]">
                  <input
                    className="input-field"
                    value={step.title}
                    onChange={(e) => updateListItem('steps', index, { ...step, title: e.target.value })}
                    placeholder="Pick your plan"
                  />
                  <textarea
                    className="input-field min-h-24"
                    value={step.description}
                    onChange={(e) => updateListItem('steps', index, { ...step, description: e.target.value })}
                    placeholder="Explain this step"
                  />
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => removeListItem('steps', index)}
                    disabled={pricing.steps.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => addListItem('steps', { ...emptyStep })}>
              <Plus className="h-4 w-4" />
              Add step
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Plans" description="Edit the pricing cards shown at the top of the pricing page.">
          <div className="space-y-5">
            {pricing.plans.map((plan, index) => (
              <div key={`plan-${index}`} className="rounded-2xl border border-border p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-ink">Plan {index + 1}</h3>
                    <p className="text-sm text-ink-muted">Use stable keys like starter, plus, premium, or enterprise.</p>
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => removeListItem('plans', index)}
                    disabled={pricing.plans.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="label-text text-slate-700">Plan key</label>
                    <input className="input-field" value={plan.key} onChange={(e) => updatePlan(index, 'key', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-text text-slate-700">Plan name</label>
                    <input className="input-field" value={plan.name} onChange={(e) => updatePlan(index, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-text text-slate-700">Price</label>
                    <input className="input-field" value={plan.price} onChange={(e) => updatePlan(index, 'price', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-text text-slate-700">Period</label>
                    <input className="input-field" value={plan.period} onChange={(e) => updatePlan(index, 'period', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-text text-slate-700">Badge</label>
                    <input className="input-field" value={plan.badge} onChange={(e) => updatePlan(index, 'badge', e.target.value)} />
                  </div>
                  <div>
                    <label className="label-text text-slate-700">CTA label</label>
                    <input className="input-field" value={plan.ctaLabel} onChange={(e) => updatePlan(index, 'ctaLabel', e.target.value)} />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="label-text text-slate-700">Description</label>
                    <textarea
                      className="input-field min-h-24"
                      value={plan.description}
                      onChange={(e) => updatePlan(index, 'description', e.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={Boolean(plan.highlighted)}
                      onChange={(e) => updatePlan(index, 'highlighted', e.target.checked)}
                    />
                    Highlight this plan
                  </label>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-slate-700">Features</p>
                  {plan.features.map((feature, featureIndex) => (
                    <div key={`plan-${index}-feature-${featureIndex}`} className="flex gap-3">
                      <input
                        className="input-field"
                        value={feature}
                        onChange={(e) => updatePlanFeature(index, featureIndex, e.target.value)}
                      />
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => updatePlan(index, 'features', plan.features.filter((_, i) => i !== featureIndex))}
                        disabled={plan.features.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updatePlan(index, 'features', [...plan.features, ''])}
                  >
                    <Plus className="h-4 w-4" />
                    Add feature
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => addListItem('plans', { ...emptyPlan })}>
              <Plus className="h-4 w-4" />
              Add plan
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Comparison table" description="Create sections and rows for the pricing matrix.">
          <div className="space-y-5">
            {pricing.comparisonSections.map((section, sectionIndex) => (
              <div key={`comparison-${sectionIndex}`} className="rounded-2xl border border-border p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="label-text text-slate-700">Section title</label>
                    <input
                      className="input-field"
                      value={section.title}
                      onChange={(e) => updateComparisonSection(sectionIndex, 'title', e.target.value)}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => removeListItem('comparisonSections', sectionIndex)}
                    disabled={pricing.comparisonSections.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {section.rows.map((row, rowIndex) => (
                    <div key={`comparison-${sectionIndex}-row-${rowIndex}`} className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <label className="label-text text-slate-700">Row label</label>
                          <input
                            className="input-field"
                            value={row.label}
                            onChange={(e) => updateComparisonRow(sectionIndex, rowIndex, 'label', e.target.value)}
                          />
                        </div>
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() =>
                            updateComparisonSection(
                              sectionIndex,
                              'rows',
                              section.rows.filter((_, index) => index !== rowIndex),
                            )
                          }
                          disabled={section.rows.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-4">
                        {['starter', 'plus', 'premium', 'enterprise'].map((planKey) => (
                          <div key={planKey}>
                            <label className="label-text capitalize text-slate-700">{planKey}</label>
                            <input
                              className="input-field"
                              value={row.values?.[planKey] ?? ''}
                              onChange={(e) => updateComparisonValue(sectionIndex, rowIndex, planKey, e.target.value)}
                              placeholder="Yes / No / Custom"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateComparisonSection(sectionIndex, 'rows', [
                        ...section.rows,
                        { ...emptyComparisonRow, values: { ...emptyComparisonRow.values } },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Add row
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                addListItem('comparisonSections', {
                  ...emptyComparisonSection,
                  rows: [{ ...emptyComparisonRow, values: { ...emptyComparisonRow.values } }],
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add comparison section
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="FAQs" description="Answers shown below the comparison table.">
          <div className="space-y-4">
            {pricing.faqs.map((faq, index) => (
              <div key={`faq-${index}`} className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <label className="label-text text-slate-700">Question</label>
                    <input
                      className="input-field"
                      value={faq.question}
                      onChange={(e) => updateListItem('faqs', index, { ...faq, question: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => removeListItem('faqs', index)}
                    disabled={pricing.faqs.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <label className="label-text text-slate-700">Answer</label>
                  <textarea
                    className="input-field min-h-24"
                    value={faq.answer}
                    onChange={(e) => updateListItem('faqs', index, { ...faq, answer: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => addListItem('faqs', { ...emptyFaq })}>
              <Plus className="h-4 w-4" />
              Add FAQ
            </Button>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Saving pricing page...' : 'Save pricing page'}
          </Button>
        </div>
      </form>
    </div>
  )
}
