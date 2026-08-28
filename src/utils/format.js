export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatCurrency(cents, currency = 'USD') {
  const code = String(currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).format((Number(cents) || 0) / 100)
  } catch {
    return `${code} ${((Number(cents) || 0) / 100).toFixed(2)}`
  }
}

export function capitalize(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function isCancellationScheduled(sub) {
  const status = String(sub?.status || sub?.subscription_status || '').toLowerCase()
  const plan = String(sub?.plan || 'free').toLowerCase()
  return status === 'cancelled' && plan !== 'free'
}

export function subscriptionStatusLabel(sub) {
  if (isCancellationScheduled(sub)) return 'Cancellation scheduled'
  const status = sub?.status || sub?.subscription_status
  return status ? capitalize(String(status).replace(/_/g, ' ')) : '—'
}

export function cancellationNotice(sub) {
  if (!isCancellationScheduled(sub)) return null
  const until = formatDate(sub?.current_period_end || sub?.cancelAtPeriodEnd)
  const plan = capitalize(sub?.plan || 'paid')
  return `Keeps ${plan} until ${until}. No refund for the current period; no further charges after that date.`
}
