import { useMemo } from 'react'

const CRM_EMAIL_DOMAIN = 'checkareview.com'

/** Split stored email into local part for domain-affixed CRM inputs */
export function crmEmailLocalPart(email = '') {
  const value = String(email || '').trim().toLowerCase()
  if (!value) return ''
  if (value.endsWith(`@${CRM_EMAIL_DOMAIN}`)) {
    return value.slice(0, -(CRM_EMAIL_DOMAIN.length + 1))
  }
  // Legacy/other domains: show full address in the local field for editing
  return value.includes('@') ? value : value
}

export function toCrmEmail(localPart = '') {
  const raw = String(localPart || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw.includes('@')) {
    // Already a full email (e.g. while editing a non-company address)
    return raw
  }
  return `${raw}@${CRM_EMAIL_DOMAIN}`
}

/**
 * Empty username input + fixed @checkareview.com suffix.
 * value / onChange use the local part only (no @domain).
 */
export default function DomainEmailInput({
  id = 'email',
  label = 'Email',
  value = '',
  onChange,
  required = false,
  disabled = false,
  className = '',
  labelClassName = 'mb-1.5 block text-sm font-medium text-gray-700',
  placeholder = '',
}) {
  const displayValue = useMemo(() => crmEmailLocalPart(value), [value])

  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
      )}
      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
        <input
          id={id}
          type="text"
          name="crm-email-local"
          autoComplete="off"
          required={required}
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value.replace(/\s/g, '').replace(/@.*$/, '')
            onChange?.(next)
          }}
          className={`min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 ${className}`}
        />
        <span className="inline-flex shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
          @{CRM_EMAIL_DOMAIN}
        </span>
      </div>
    </div>
  )
}

export { CRM_EMAIL_DOMAIN }
