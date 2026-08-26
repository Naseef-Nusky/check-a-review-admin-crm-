import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatCurrency, formatDate } from '../utils/format'

function statusClass(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'succeeded' || value === 'completed') return 'bg-emerald-100 text-emerald-800'
  if (value === 'failed' || value === 'canceled' || value === 'cancelled') return 'bg-red-100 text-red-800'
  return 'bg-slate-100 text-slate-700'
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getPayments()
      .then(setPayments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Square charges recorded after checkout confirmation or webhook. Amounts are from plan catalog or Square."
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
              <th className="px-4 py-3 font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 font-medium text-gray-700">Payment ID</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No payments found yet. They appear after a successful business checkout.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-600">{formatDate(payment.created_at)}</td>
                  <td className="px-4 py-3 font-medium">
                    {payment.business_id ? (
                      <Link
                        to={`/businesses/${payment.business_id}`}
                        className="text-primary-700 hover:underline"
                      >
                        {payment.business_name}
                      </Link>
                    ) : (
                      payment.business_name
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">{payment.plan || '—'}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(payment.status)}`}
                    >
                      {payment.status || '—'}
                    </span>
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3 font-mono text-xs text-slate-500" title={payment.square_payment_id || ''}>
                    {payment.square_payment_id || payment.id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
