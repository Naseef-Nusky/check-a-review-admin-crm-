import { Link } from 'react-router-dom'

const iconBtnBase =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50'

const iconBtnVariants = {
  default: 'border-border text-slate-600 hover:bg-slate-50',
  primary: 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100',
  danger: 'border-red-200 text-red-600 hover:bg-red-50',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

const textBtnBase =
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm'

export function TableActionsHeader({ children = 'Actions', className = '' }) {
  return (
    <th className={`table-actions-col text-right sm:text-left ${className}`}>
      <span className="hidden sm:inline">{children}</span>
      <span className="sm:hidden" aria-label={typeof children === 'string' ? children : 'Actions'}>
        ···
      </span>
    </th>
  )
}

export function TableActionsCell({ children, className = '', align = 'end' }) {
  return (
    <td className={`table-actions-col ${className}`}>
      <div className={`table-actions ${align === 'end' ? 'justify-end' : 'justify-start'}`}>{children}</div>
    </td>
  )
}

export function TableIconButton({
  to,
  href,
  onClick,
  title,
  ariaLabel,
  variant = 'default',
  disabled = false,
  className = '',
  children,
  type = 'button',
}) {
  const classes = `${iconBtnBase} ${iconBtnVariants[variant] || iconBtnVariants.default} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} title={title} aria-label={ariaLabel || title}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        title={title}
        aria-label={ariaLabel || title}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
    >
      {children}
    </button>
  )
}

/** Icon + optional label; label hidden on small screens. */
export function TableActionButton({
  onClick,
  title,
  ariaLabel,
  variant = 'default',
  disabled = false,
  className = '',
  icon: Icon,
  children,
  type = 'button',
}) {
  const variantClasses = {
    default: 'border-border bg-white text-slate-700 hover:bg-slate-50',
    primary: 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100',
    secondary: 'border-border bg-white text-slate-700 hover:bg-slate-50',
    danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  }

  return (
    <button
      type={type}
      className={`${textBtnBase} ${variantClasses[variant] || variantClasses.default} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children ? <span className="hidden min-[480px]:inline">{children}</span> : null}
    </button>
  )
}
