import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

function userHaystack(user) {
  return [user.name, user.email].filter(Boolean).join(' ').toLowerCase()
}

function formatLabel(user) {
  if (!user) return ''
  return user.email ? `${user.name} (${user.email})` : user.name
}

export default function CustomerSearchSelect({
  users,
  value,
  onChange,
  placeholder = 'Search by name or email…',
  id,
  disabled = false,
}) {
  const listId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState('')

  const selected = users.find((user) => String(user.id) === String(value))
  const effectiveQuery = localQuery.trim().toLowerCase()

  const options = useMemo(() => {
    return users.filter((user) => {
      if (!effectiveQuery) return true
      return userHaystack(user).includes(effectiveQuery)
    })
  }, [users, effectiveQuery])

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

  const handleSelect = (userId) => {
    onChange(userId)
    setOpen(false)
    setLocalQuery('')
  }

  const handleClear = () => {
    onChange('')
    setLocalQuery('')
    setOpen(false)
  }

  const inputValue = open ? localQuery : selected ? formatLabel(selected) : ''

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="search"
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            if (!disabled) setOpen(true)
          }}
          onChange={(e) => {
            setLocalQuery(e.target.value)
            setOpen(true)
            if (value) onChange('')
          }}
          className="input-field pl-9 pr-9"
          aria-expanded={open}
          aria-controls={listId}
          role="combobox"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 disabled:opacity-40"
            aria-label="Clear customer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">No customers found</li>
          ) : (
            options.slice(0, 50).map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={String(user.id) === String(value)}
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => handleSelect(user.id)}
                >
                  <span className="font-medium text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
