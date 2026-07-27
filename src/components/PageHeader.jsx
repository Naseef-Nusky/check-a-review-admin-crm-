import { createContext, useContext, useState } from 'react'
import { createPortal } from 'react-dom'

const PageHeaderSlotContext = createContext(null)

export function PageHeaderProvider({ children }) {
  const [slotEl, setSlotEl] = useState(null)
  return (
    <PageHeaderSlotContext.Provider value={slotEl}>
      {children(setSlotEl)}
    </PageHeaderSlotContext.Provider>
  )
}

export default function PageHeader({ title, description, children, kicker }) {
  const slotEl = useContext(PageHeaderSlotContext)
  if (!slotEl) return null

  return createPortal(
    <div className="flex min-h-[4.5rem] flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">{kicker}</p>
        ) : null}
        <h1 className={`${kicker ? 'mt-1' : ''} truncate text-xl font-semibold tracking-tight text-white sm:text-2xl`}>
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-3">{children}</div> : null}
    </div>,
    slotEl,
  )
}
