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
    <div className="flex min-h-[3.5rem] flex-col gap-3 py-1 sm:min-h-[4.5rem] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-300 sm:text-xs">
            {kicker}
          </p>
        ) : null}
        <h1
          className={`${kicker ? 'mt-1' : ''} text-lg font-semibold tracking-tight text-white sm:truncate sm:text-2xl`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:gap-3">{children}</div> : null}
    </div>,
    slotEl,
  )
}
