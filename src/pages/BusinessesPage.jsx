import { useEffect, useState } from 'react'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate } from '../utils/format'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getBusinesses()
      .then(setBusinesses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader title="Manage Businesses" description="View and manage business accounts" />
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Business</th>
              <th className="px-4 py-3 font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 font-medium text-gray-700">Rating</th>
              <th className="px-4 py-3 font-medium text-gray-700">Plan</th>
              <th className="px-4 py-3 font-medium text-gray-700">Owner</th>
              <th className="px-4 py-3 font-medium text-gray-700">Joined</th>
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No businesses found
                </td>
              </tr>
            ) : (
              businesses.map((biz) => (
                <tr key={biz.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{biz.name}</td>
                  <td className="px-4 py-3 text-gray-500">{biz.category || '—'}</td>
                  <td className="px-4 py-3">{Number(biz.average_rating || 0).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-800">
                      {biz.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{biz.owner_email}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(biz.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
