import { useEffect, useState } from 'react'
import { CloudUpload, RefreshCw, Save } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function BillingPlansPage() {
  const [plans, setPlans] = useState([])
  const [squareConfigured, setSquareConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingKey, setSavingKey] = useState('')
  const [syncingKey, setSyncingKey] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getBillingPlans()
      setPlans(data.plans || [])
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
        amountCents: Math.round(Number(plan.amountCents)),
        currency: plan.currency,
        cadence: plan.cadence,
        active: plan.active,
      })
      setPlans((prev) => prev.map((row) => (row.key === updated.key ? updated : row)))
      setMessage(`${updated.name} saved. Click “Sync to Square” to push the latest price.`)
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
      setMessage(`${updated.name} synced to Square.`)
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
      setPlans(updated || [])
      setMessage('Starter and Premium synced to Square.')
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
        description="Create and update real Square subscription plans used for business upgrades."
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
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Price (cents)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={plan.amountCents}
                    onChange={(e) => updateLocal(plan.key, 'amountCents', e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {(Number(plan.amountCents) / 100 || 0).toLocaleString(undefined, {
                      style: 'currency',
                      currency: plan.currency || 'USD',
                    })}
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
                  <input
                    className="input-field uppercase"
                    value={plan.currency}
                    onChange={(e) => updateLocal(plan.key, 'currency', e.target.value.toUpperCase())}
                  />
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
                disabled={!squareConfigured || Boolean(savingKey || syncingKey)}
                onClick={() => syncPlan(plan.key)}
              >
                <CloudUpload className="h-4 w-4" />
                {syncingKey === plan.key ? 'Syncing...' : 'Sync to Square'}
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
