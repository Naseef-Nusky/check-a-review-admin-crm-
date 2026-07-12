const iconClass = 'h-[1.1em] w-[1.1em] shrink-0 stroke-[1.5]'

export function IconBox({ children, className = '' }) {
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ${className}`}>
      {children}
    </span>
  )
}

export function NavIcon({ icon: Icon, className = '' }) {
  if (!Icon) return null
  return <Icon className={`${iconClass} ${className}`} strokeWidth={1.5} aria-hidden="true" />
}

export function StatIcon({ icon: Icon }) {
  if (!Icon) return null
  return (
    <IconBox className="mb-4 bg-primary-50 text-primary-600">
      <Icon className={iconClass} strokeWidth={1.5} aria-hidden="true" />
    </IconBox>
  )
}
