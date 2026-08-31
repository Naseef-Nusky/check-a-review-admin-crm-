import { AlertTriangle, CreditCard, ShieldCheck } from 'lucide-react'

const TEST_CARD = '4532 0123 4567 8901'

export default function SquareBillingBanner({
  squareConfigured = false,
  squareEnvironment = 'sandbox',
  paymentsAreTest = true,
  currency = 'GBP',
  className = 'mb-4',
}) {
  if (!squareConfigured) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}>
        <p className="font-medium">Square billing is not configured</p>
        <p className="mt-1 text-amber-800">
          Add Square credentials to the backend <code className="rounded bg-amber-100 px-1">.env</code> file, sync billing
          plans, then test checkout from the business portal.
        </p>
      </div>
    )
  }

  if (paymentsAreTest || squareEnvironment !== 'production') {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={1.5} aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-semibold">Square sandbox — test payments only</p>
            <p className="mt-1 text-amber-800">
              Charges in CRM and the business portal are <strong>not real money</strong>. Payments are stored as{' '}
              <span className="font-medium">Test</span> until you switch the backend to production Square credentials.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-medium text-amber-900 ring-1 ring-amber-200">
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                Test card: {TEST_CARD}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-amber-900 ring-1 ring-amber-200">
                Any future expiry · any CVV
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 font-medium text-amber-900 ring-1 ring-amber-200">
                Currency: {currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ${className}`}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="font-semibold">Square production — live payments</p>
          <p className="mt-1 text-emerald-800">
            Checkout and renewals charge real cards in {currency}. New payment rows are marked{' '}
            <span className="font-medium">Live</span> in this table.
          </p>
        </div>
      </div>
    </div>
  )
}

export function PaymentModeBadge({ isTest }) {
  if (isTest === false) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Live</span>
    )
  }
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Test</span>
}
