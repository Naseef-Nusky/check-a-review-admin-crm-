import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate } from '../utils/format'

function statusClass(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'active' || value === 'trialing') return 'bg-emerald-100 text-emerald-800'
  if (value === 'past_due') return 'bg-amber-100 text-amber-800'
  if (value === 'cancelled' || value === 'canceled') return 'bg-slate-100 text-slate-600'
  return 'bg-slate-100 text-slate-700'
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getSubscriptions()
      .then(setSubscriptions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Live business plans after Square checkout and renewals. Pending means payment started but not confirmed yet."
      >
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </PageHeader>

      <div className="card table-scroll">
        <table className="data-table min-w-[56rem]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Current plan</th>
              <th className="px-4 py-3 font-medium text-gray-700">Pending plan</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 font-medium text-gray-700">Period end</th>
              <th className="px-4 py-3 font-medium text-gray-700">Square sub</th>
              <th className="px-4 py-3 font-medium text-gray-700">Updated</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to={`/businesses/${sub.business_id}`}
                      className="text-primary-700 hover:underline"
                    >
                      {sub.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-800">
                      {sub.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sub.pending_plan ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium capitalize text-amber-800">
                        {sub.pending_plan}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(sub.status)}`}
                    >
                      {(sub.status || '—').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(sub.current_period_end)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {sub.square_subscription_id || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(sub.updated_at || sub.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
