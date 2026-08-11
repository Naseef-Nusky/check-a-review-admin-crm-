import { useEffect, useState } from 'react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatCurrency, formatDate } from '../utils/format'

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
      <PageHeader title="Payments" description="Square payment history and transactions" />
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Payment ID</th>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">
                    {payment.square_payment_id || payment.stripe_payment_intent_id || payment.id}
                  </td>
                  <td className="px-4 py-3 font-medium">{payment.business_name}</td>
                  <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(payment.created_at)}</td>
                  <td className="px-4 py-3 capitalize text-green-600">{payment.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
