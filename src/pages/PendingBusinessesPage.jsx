import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate } from '../utils/format'
import { requestCrmBadgesRefresh } from '../utils/crmEvents'
import BusinessLogo from '../components/BusinessLogo'

export default function PendingBusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getPendingBusinesses()
      .then(setBusinesses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const moderate = async (id, status) => {
    setActionId(id)
    try {
      await adminApi.moderateBusiness(id, status)
      setBusinesses((prev) => prev.filter((b) => b.id !== id))
      requestCrmBadgesRefresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        title="Pending business queue"
        description="New business listings waiting for admin approval before they appear publicly"
      />
      {businesses.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          No businesses waiting for approval
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((biz) => {
            return (
              <div key={biz.id} className="card border-amber-200 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <BusinessLogo logoUrl={biz.logo_url} name={biz.name} className="h-12 w-12" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{biz.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{biz.category || 'Uncategorized'}</p>
                      <p className="mt-1 text-xs text-slate-500 break-all">
                        {biz.owner_name || 'Owner'} · {biz.owner_email || biz.email || 'No email'}
                      </p>
                      {biz.website ? (
                        <p className="mt-1 truncate text-xs text-slate-500">{biz.website}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-gray-400">Submitted {formatDate(biz.created_at)}</p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Pending
                  </span>
                </div>
                <div className="action-row mt-4">
                  <Link
                    to={`/businesses/${biz.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View details
                  </Link>
                  <Button size="sm" disabled={actionId === biz.id} onClick={() => moderate(biz.id, 'published')}>
                    Approve & Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={actionId === biz.id}
                    onClick={() => moderate(biz.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
