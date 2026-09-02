import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

function businessHaystack(business) {
  return [
    business.name,
    business.slug,
    business.category,
    business.website,
    business.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function formatLabel(business) {
  const rating =
    business.average_rating != null
      ? ` (${Number(business.average_rating).toFixed(1)}★)`
      : ''
  return `${business.name}${rating}`
}

export default function BusinessSearchSelect({
  businesses,
  value,
  onChange,
  excludeIds = [],
  filterQuery = '',
  placeholder = 'Search by name, category, website…',
  id,
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState('')

  const selected = businesses.find((business) => String(business.id) === String(value))
  const excludeSet = useMemo(() => new Set(excludeIds.map(String)), [excludeIds])
  const effectiveQuery = (localQuery.trim() || filterQuery.trim()).toLowerCase()

  const options = useMemo(() => {
    return businesses.filter((business) => {
      if (excludeSet.has(String(business.id))) return false
      if (!effectiveQuery) return true
      return businessHaystack(business).includes(effectiveQuery)
    })
  }, [businesses, excludeSet, effectiveQuery])

  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setLocalQuery('')
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const handleSelect = (businessId) => {
    onChange(businessId)
    setOpen(false)
    setLocalQuery('')
  }

  const handleClear = () => {
    onChange('')
    setLocalQuery('')
    setOpen(false)
  }

  const inputValue = open
    ? localQuery
    : selected
      ? formatLabel(selected)
      : ''

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={inputValue}
          placeholder={selected && !open ? undefined : placeholder}
          onFocus={() => {
            setOpen(true)
            setLocalQuery(filterQuery || '')
          }}
          onChange={(event) => {
            setOpen(true)
            setLocalQuery(event.target.value)
          }}
          className="input-field pl-9 pr-9"
          autoComplete="off"
        />
        {(selected || localQuery) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <li role="option">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="block w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              — None —
            </button>
          </li>
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No matching businesses</li>
          ) : (
            options.map((business) => {
              const isSelected = String(business.id) === String(value)
              return (
                <li key={business.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(String(business.id))}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      isSelected ? 'bg-primary-50 text-primary-800' : 'text-slate-800'
                    }`}
                  >
                    <span className="font-medium">{formatLabel(business)}</span>
                    {business.category ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{business.category}</span>
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
