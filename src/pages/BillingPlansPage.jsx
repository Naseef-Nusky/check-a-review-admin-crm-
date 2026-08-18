import { useEffect, useState } from 'react'
import { CloudUpload, RefreshCw, Save } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function centsToDollars(cents) {
  return (Number(cents || 0) / 100).toFixed(2)
}

function currencySymbol(currency) {
  const code = String(currency || '').toUpperCase()
  if (code === 'GBP') return '£'
  if (code === 'EUR') return 'EUR '
  return '$'
}

export default function BillingPlansPage() {
  const [plans, setPlans] = useState([])
  const [priceDraft, setPriceDraft] = useState({})
  const [squareConfigured, setSquareConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingKey, setSavingKey] = useState('')
  const [syncingKey, setSyncingKey] = useState('')

  const applyPlans = (nextPlans) => {
    const list = nextPlans || []
    setPlans(list)
    setPriceDraft(
      Object.fromEntries(list.map((plan) => [plan.key, centsToDollars(plan.monthlyAmountCents ?? plan.amountCents)])),
    )
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getBillingPlans()
      applyPlans(data.plans || [])
      setSquareConfigured(Boolean(data.squareConfigured))
    } catch (err) {
      setError(err.message || 'Failed to load billing plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateLocal = (key, field, value) => {
    setPlans((prev) => prev.map((plan) => (plan.key === key ? { ...plan, [field]: value } : plan)))
  }

  const savePlan = async (plan) => {
    setSavingKey(plan.key)
    setError('')
    setMessage('')
    try {
      const updated = await adminApi.updateBillingPlan(plan.key, {
        name: plan.name,
        amountDollars: Number(priceDraft[plan.key]),
        currency: plan.currency,
        cadence: plan.cadence,
        active: plan.active,
        invitationsPerMonth: plan.invitationsPerMonth,
        widgets: plan.widgets,
        users: plan.users,
        domains: plan.domains,
        integrations: plan.integrations,
      })
      setPlans((prev) => prev.map((row) => (row.key === updated.key ? updated : row)))
      setPriceDraft((prev) => ({
        ...prev,
        [updated.key]: centsToDollars(updated.monthlyAmountCents ?? updated.amountCents),
      }))
      setMessage(`${updated.name} saved in ${updated.currency}. Click “Sync to Square” to push the latest price.`)
    } catch (err) {
      setError(err.message || 'Failed to save plan')
    } finally {
      setSavingKey('')
    }
  }

  const syncPlan = async (key) => {
    setSyncingKey(key)
    setError('')
    setMessage('')
    try {
      const updated = await adminApi.syncBillingPlan(key)
      setPlans((prev) => prev.map((row) => (row.key === updated.key ? updated : row)))
      setPriceDraft((prev) => ({
        ...prev,
        [updated.key]: centsToDollars(updated.monthlyAmountCents ?? updated.amountCents),
      }))
      setMessage(`${updated.name} synced to Square in ${updated.currency}.`)
    } catch (err) {
      setError(err.message || 'Failed to sync plan to Square')
    } finally {
      setSyncingKey('')
    }
  }

  const syncAll = async () => {
    setSyncingKey('all')
    setError('')
    setMessage('')
    try {
      const updated = await adminApi.syncAllBillingPlans()
      applyPlans(updated || [])
      setMessage('Starter, Plus, and Premium synced to Square. Enterprise stays sales-led.')
    } catch (err) {
      setError(err.message || 'Failed to sync plans')
    } finally {
      setSyncingKey('')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error && plans.length === 0) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        kicker="Billing"
        title="Billing plans"
        description="Manage plan prices, currency, and limits here. Enterprise is quoted by sales and is not synced to Square."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={load} disabled={Boolean(syncingKey || savingKey)}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={syncAll} disabled={!squareConfigured || Boolean(syncingKey || savingKey)}>
            <CloudUpload className="h-4 w-4" />
            {syncingKey === 'all' ? 'Syncing...' : 'Sync all to Square'}
          </Button>
        </div>
      </PageHeader>

      {!squareConfigured ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` to the backend `.env` before syncing plans.
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.key} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{plan.key}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{plan.name}</h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  plan.synced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {plan.synced ? 'Synced' : 'Not synced'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Display name</label>
                <input
                  className="input-field"
                  value={plan.name}
                  onChange={(e) => updateLocal(plan.key, 'name', e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Price ({plan.currency || 'GBP'} / month)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">
                      {currencySymbol(plan.currency)}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field pl-7"
                      value={priceDraft[plan.key] ?? ''}
                      onChange={(e) =>
                        setPriceDraft((prev) => ({ ...prev, [plan.key]: e.target.value }))
                      }
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Monthly price in {plan.currency || 'GBP'}. Yearly Square charge is this amount × 12
                    {plan.perDomain ? ', multiplied by domains at checkout' : ''}.
                    {plan.monthlyAmountCents
                      ? ` Annual charge: ${currencySymbol(plan.currency)}${((Number(plan.amountCents) || 0) / 100).toFixed(0)}.`
                      : ''}
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Cadence</label>
                  <select
                    className="input-field"
                    value={plan.cadence}
                    onChange={(e) => updateLocal(plan.key, 'cadence', e.target.value)}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Currency</label>
                  <select
                    className="input-field"
                    value={plan.currency || 'GBP'}
                    onChange={(e) => updateLocal(plan.key, 'currency', e.target.value.toUpperCase())}
                  >
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <label className="mt-7 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(plan.active)}
                    onChange={(e) => updateLocal(plan.key, 'active', e.target.checked)}
                  />
                  Active for checkout
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {['invitationsPerMonth', 'widgets', 'users', 'domains', 'integrations'].map((field) => (
                <div key={field}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    {field === 'invitationsPerMonth'
                      ? 'Invitations / month'
                      : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    className="input-field"
                    value={
                      plan[field] != null && Number.isFinite(Number(plan[field]))
                        ? plan[field]
                        : plan.limitsLabel?.[field === 'invitationsPerMonth' ? 'invitations' : field] || 'Unlimited'
                    }
                    onChange={(e) => updateLocal(plan.key, field, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <p>Square plan ID: {plan.squarePlanId || '—'}</p>
              <p className="mt-1">Variation ID: {plan.squareVariationId || '—'}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(savingKey || syncingKey)}
                onClick={() => savePlan(plan)}
              >
                <Save className="h-4 w-4" />
                {savingKey === plan.key ? 'Saving...' : 'Save'}
              </Button>
              <Button
                type="button"
                disabled={
                  plan.checkout === 'sales' ||
                  !squareConfigured ||
                  Boolean(savingKey || syncingKey)
                }
                onClick={() => syncPlan(plan.key)}
              >
                <CloudUpload className="h-4 w-4" />
                {plan.checkout === 'sales'
                  ? 'Sales only'
                  : syncingKey === plan.key
                    ? 'Syncing...'
                    : 'Sync to Square'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Pricing CMS only changes website marketing copy. This page manages the real Square plans used at checkout.
      </p>
    </div>
  )
}
