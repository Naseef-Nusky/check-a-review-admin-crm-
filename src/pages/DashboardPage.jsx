import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Building2, MessageSquare, PoundSterling, Users } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatCurrency } from '../utils/format'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        kicker="Overview"
        title="Admin Dashboard"
        description="Platform performance, moderation queue, and revenue signals."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={(stats.totalUsers ?? stats.totalCustomers).toLocaleString()} icon={Users} />
        <StatCard label="Total businesses" value={stats.totalBusinesses.toLocaleString()} icon={Building2} />
        <StatCard label="Total reviews" value={stats.totalReviews.toLocaleString()} icon={MessageSquare} />
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats.totalRevenue, stats.revenueCurrency)}
          icon={PoundSterling}
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Moderation</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">Pending reviews</h2>
              <p className="mt-1 text-sm text-ink-muted">Reviews waiting for manual review</p>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 stroke-[1.5] text-amber-500" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-4xl font-semibold tabular-nums text-amber-600">{stats.flaggedReviews}</p>
            </div>
          </div>
          <Link to="/flagged" className="mt-5 inline-flex text-sm font-medium text-primary-700 hover:text-primary-800">
            Open review queue
          </Link>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Moderation</p>
              <h2 className="mt-2 text-xl font-semibold text-ink">Pending businesses</h2>
              <p className="mt-1 text-sm text-ink-muted">New listings waiting for approval</p>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 stroke-[1.5] text-amber-500" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-4xl font-semibold tabular-nums text-amber-600">
                {stats.pendingBusinesses ?? 0}
              </p>
            </div>
          </div>
          <Link
            to="/pending-businesses"
            className="mt-5 inline-flex text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            Open business queue
          </Link>
        </div>
      </div>
    </div>
  )
}
