import { Star } from 'lucide-react'

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export default function StarRating({
  rating = 0,
  max = 5,
  size = 'md',
  showValue = false,
  className = '',
}) {
  const value = Math.max(0, Math.min(max, Number(rating) || 0))
  const iconSize = sizeClasses[size] || sizeClasses.md

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of ${max} stars`}>
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.min(1, Math.max(0, value - i))
          const isFull = fill >= 0.75
          const isHalf = fill >= 0.25 && fill < 0.75

          if (isFull) {
            return (
              <Star
                key={i}
                className={`${iconSize} fill-amber-400 text-amber-400`}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            )
          }

          if (isHalf) {
            return (
              <span key={i} className={`relative inline-flex ${iconSize}`}>
                <Star
                  className={`${iconSize} fill-slate-200 text-slate-200`}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    className={`${iconSize} fill-amber-400 text-amber-400`}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
              </span>
            )
          }

          return (
            <Star
              key={i}
              className={`${iconSize} fill-slate-200 text-slate-200`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold tabular-nums text-slate-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
