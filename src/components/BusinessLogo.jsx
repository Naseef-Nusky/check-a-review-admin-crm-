import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '../utils/constants'

/** Business logo with initials fallback when missing or failed to load */
export default function BusinessLogo({ logoUrl, name, className = 'h-10 w-10', textClassName = 'text-sm' }) {
  const logoSrc = resolveMediaUrl(logoUrl)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [logoSrc])

  const showImage = Boolean(logoSrc) && !failed
  const initial = (name || '?').charAt(0).toUpperCase()

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80 ${className}`}
    >
      {showImage ? (
        <img
          src={logoSrc}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`font-semibold text-slate-400 ${textClassName}`}>{initial}</span>
      )}
    </div>
  )
}
