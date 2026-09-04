import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate } from '../utils/format'
import { requestCrmBadgesRefresh } from '../utils/crmEvents'
import BusinessLogo from '../components/BusinessLogo'
import { API_BASE_URL } from '../utils/constants'

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  needs_info: 'Needs info',
  approved: 'Approved',
  rejected: 'Rejected',
}

async function downloadClaimAttachment(attachment) {
  const token = localStorage.getItem('admin_token')
  const response = await fetch(`${API_BASE_URL}/admin/claims/attachments/${attachment.id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const json = await response.json().catch(() => ({}))
    throw new Error(json.message || 'Failed to download attachment')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = attachment.originalName || 'attachment'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function StatusPill({ status }) {
  const tones = {
    pending: 'bg-amber-100 text-amber-800',
    under_review: 'bg-blue-100 text-blue-800',
    needs_info: 'bg-orange-100 text-orange-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[status] || 'bg-slate-100 text-slate-700'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function VerifyMark({ label, status }) {
  const ok = status === 'verified'
  const failed = status === 'failed'
  return (
    <p className="text-xs text-slate-600">
      {label}:{' '}
      <span className={ok ? 'font-semibold text-emerald-700' : failed ? 'font-semibold text-red-700' : 'text-slate-500'}>
        {ok ? '✓ Verified' : failed ? 'Failed' : status === 'not_provided' ? '—' : 'Pending'}
      </span>
    </p>
  )
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const [notes, setNotes] = useState({})

  const load = () => {
    setLoading(true)
    setError('')
    adminApi
      .getClaims()
      .then(setClaims)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const setNote = (id, value) => setNotes((prev) => ({ ...prev, [id]: value }))

  const review = async (id, action) => {
    setActionId(id)
    try {
      await adminApi.reviewClaim(id, { action, notes: notes[id] || undefined })
      load()
      requestCrmBadgesRefresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionId(null)
    }
  }

  const updateVerification = async (id, field, value) => {
    setActionId(id)
    try {
      await adminApi.updateClaimVerification(id, { [field]: value })
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const openClaims = claims.filter((c) => ['pending', 'under_review', 'needs_info'].includes(c.status))
  const closedClaims = claims.filter((c) => !['pending', 'under_review', 'needs_info'].includes(c.status))

  return (
    <div>
      <PageHeader
        title="Claim requests"
        description="Review business claim submissions, verification status, and ownership transfer"
      />

      {openClaims.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          No open claim requests
        </div>
      ) : (
        <div className="space-y-4">
          {openClaims.map((claim) => (
            <div key={claim.id} className="card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <BusinessLogo logoUrl={claim.logoUrl} name={claim.businessName} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{claim.businessName}</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      Claimant: {claim.fullName} · {claim.jobTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 break-all">
                      Email: {claim.email} · Phone: {claim.phone || '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Relationship: {claim.relationship}</p>
                    <p className="mt-2 text-xs text-slate-500">Submitted {formatDate(claim.createdAt)}</p>
                  </div>
                </div>
                <StatusPill status={claim.status} />
              </div>

              <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                <p className="text-xs text-slate-600">
                  Email:{' '}
                  <span className={claim.emailVerified ? 'font-semibold text-emerald-700' : 'text-amber-700'}>
                    {claim.emailVerified ? '✓ Verified' : 'Unverified'}
                  </span>
                </p>
                <VerifyMark label="Business details / contact" status={claim.contactStatus} />
                <VerifyMark label="Identity" status={claim.identityStatus} />
                <VerifyMark label="Ownership" status={claim.ownershipStatus} />
              </div>

              {claim.verificationInfo ? (
                <div className="mt-3 rounded-xl border border-border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification information</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{claim.verificationInfo}</p>
                </div>
              ) : null}

              {(claim.attachments || []).length > 0 ? (
                <div className="mt-3 rounded-xl border border-border bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
                  <ul className="mt-2 space-y-1">
                    {claim.attachments.map((file) => (
                      <li key={file.id}>
                        <button
                          type="button"
                          className="text-sm font-medium text-primary-700 hover:underline"
                          onClick={() =>
                            downloadClaimAttachment(file).catch((err) => alert(err.message))
                          }
                        >
                          {file.originalName}
                          {file.sizeBytes ? ` (${Math.round(file.sizeBytes / 1024)} KB)` : ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ['contactStatus', 'Contact'],
                  ['identityStatus', 'Identity'],
                  ['ownershipStatus', 'Ownership'],
                ].map(([field, label]) => (
                  <select
                    key={field}
                    className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs"
                    disabled={actionId === claim.id}
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return
                      updateVerification(claim.id, field, e.target.value)
                      e.target.value = ''
                    }}
                  >
                    <option value="">Mark {label}…</option>
                    <option value="verified">Verified</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                ))}
              </div>

              <textarea
                className="mt-4 w-full rounded-xl border border-border px-3 py-2 text-sm"
                rows={2}
                placeholder="Admin notes (optional)"
                value={notes[claim.id] || ''}
                onChange={(e) => setNote(claim.id, e.target.value)}
              />

              <div className="action-row mt-4">
                <Link
                  to={`/businesses/${claim.businessId}`}
                  className="inline-flex rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open business
                </Link>
                <Button
                  size="sm"
                  disabled={actionId === claim.id || !claim.emailVerified}
                  onClick={() => review(claim.id, 'approve')}
                >
                  Approve Claim
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={actionId === claim.id}
                  onClick={() => review(claim.id, 'request_info')}
                >
                  Request More Information
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={actionId === claim.id}
                  onClick={() => review(claim.id, 'reject')}
                >
                  Reject Claim
                </Button>
              </div>
              {!claim.emailVerified ? (
                <p className="mt-2 text-xs text-amber-700">Approve is available after the claimant verifies their email.</p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {closedClaims.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Closed claims</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Claimant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {closedClaims.map((claim) => (
                  <tr key={claim.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link to={`/businesses/${claim.businessId}`} className="font-medium text-primary-700 hover:underline">
                        {claim.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{claim.fullName}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={claim.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(claim.reviewedAt || claim.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
