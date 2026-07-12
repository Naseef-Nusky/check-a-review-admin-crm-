const variants = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus:ring-primary-400',
  secondary: 'border border-border bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-slate-300',
  outline: 'border border-primary-300 bg-transparent text-primary-700 hover:bg-primary-50 focus:ring-primary-300',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-400',
  ghost: 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white focus:ring-slate-500',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
