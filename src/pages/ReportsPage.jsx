import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, Search, Trash2, X } from 'lucide-react'
import { adminApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import StarRating from '../components/StarRating'
import {
  TableActionsCell,
  TableActionsHeader,
  TableActionButton,
  TableIconButton,
} from '../components/TableActions'
import { formatDate } from '../utils/format'

const STATUS_FILTERS = ['all', 'open', 'reviewed', 'dismissed']

const statusColors = {
  open: 'bg-orange-100 text-orange-800',
  reviewed: 'bg-green-100 text-green-800',
  dismissed: 'bg-slate-100 text-slate-600',
}

export default function ReportsPage() {
  const { canWrite } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: 'all' })

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getReports()
      .then(setReports)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return reports.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false
      if (!q) return true
      return [r.business_name, r.review_title, r.author_name, r.reporter_name, r.reporter_email, r.reason, r.details]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [reports, filters])

  const hasActive = filters.search.trim() !== '' || filters.status !== 'all'

  const setStatus = async (id, status) => {
    setActionId(id)
    try {
      await adminApi.updateReportStatus(id, status)
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } catch (err) {
      alert(err.message)
    } finally {
      setActionId(null)
    }
  }

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return
    setActionId(id)
    try {
      await adminApi.deleteReport(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
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
      <PageHeader title="Review Reports" description="Reports submitted by users about reviews" />

      <div className="card mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search business, review, reporter, reason…"
              className="input-field pl-9"
            />
          </div>
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFilters({ search: '', status: 'all' })}
            disabled={!hasActive}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{filtered.length}</span> of{' '}
          <span className="font-medium text-slate-700">{reports.length}</span> reports
        </p>
      </div>

      <div className="card table-scroll">
        <table className="data-table min-w-[1100px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Review</th>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Reviewer</th>
              <th className="px-4 py-3 font-medium text-gray-700">Rating</th>
              <th className="px-4 py-3 font-medium text-gray-700">Report reason</th>
              <th className="px-4 py-3 font-medium text-gray-700">Reporter</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 font-medium text-gray-700">Date</th>
              <TableActionsHeader />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  {reports.length === 0 ? 'No reports yet' : 'No reports match your filters'}
                </td>
              </tr>
            ) : (
              filtered.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link
                      to={`/reviews/${report.review_id}`}
                      className="block min-w-0 max-w-[200px]"
                    >
                      <p className="truncate font-medium text-slate-900 hover:text-primary-600">
                        {report.review_title || 'Untitled review'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{report.review_content}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to={`/businesses/${report.business_id}?tab=reviews`}
                      className="text-slate-900 hover:text-primary-600 hover:underline"
                    >
                      {report.business_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{report.author_name || '—'}</p>
                    <p className="text-xs text-slate-500">{report.author_email || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StarRating rating={report.review_rating} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{report.reason}</p>
                    {report.details && (
                      <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500" title={report.details}>
                        {report.details}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{report.reporter_name || <span className="text-slate-400">Anonymous</span>}</p>
                    {report.reporter_email && (
                      <p className="text-xs text-slate-500">{report.reporter_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[report.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(report.created_at)}</td>
                  <TableActionsCell>
                    <TableIconButton
                      to={`/reviews/${report.review_id}`}
                      title="View review"
                      ariaLabel="View review"
                    >
                      <Eye className="h-4 w-4" />
                    </TableIconButton>
                    {canWrite && report.status !== 'reviewed' && (
                      <TableActionButton
                        variant="success"
                        icon={Check}
                        disabled={actionId === report.id}
                        onClick={() => setStatus(report.id, 'reviewed')}
                        title="Mark as reviewed"
                      >
                        Reviewed
                      </TableActionButton>
                    )}
                    {canWrite && report.status !== 'dismissed' && (
                      <TableActionButton
                        variant="secondary"
                        icon={X}
                        disabled={actionId === report.id}
                        onClick={() => setStatus(report.id, 'dismissed')}
                        title="Dismiss report"
                      >
                        Dismiss
                      </TableActionButton>
                    )}
                    {canWrite && (
                      <TableIconButton
                        title="Delete report"
                        ariaLabel="Delete report"
                        disabled={actionId === report.id}
                        onClick={() => deleteReport(report.id)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </TableIconButton>
                    )}
                  </TableActionsCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
