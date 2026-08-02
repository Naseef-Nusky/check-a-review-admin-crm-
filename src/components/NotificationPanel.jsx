import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Building2, CheckCheck, MessageSquare, X } from 'lucide-react'
import { adminApi } from '../services/api'
import { formatDate } from '../utils/format'

const typeIcon = {
  pending_business: Building2,
  pending_review: MessageSquare,
}

function relativeTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(value)
}

function NotificationIcon({ type }) {
  const Icon = typeIcon[type] || Bell
  return (
    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
    </span>
  )
}

export function NotificationBell({ onClick, unreadCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <Bell className="h-5 w-5" strokeWidth={1.5} />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold leading-none text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </button>
  )
}

export default function NotificationPanel({ open, onClose, onUnreadChange }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.getNotifications()
      setItems(data || [])
      onUnreadChange?.((data || []).filter((n) => !n.read).length)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [onUnreadChange])

  useEffect(() => {
    if (!open) return undefined
    load()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, load])

  const unreadCount = items.filter((n) => !n.read).length

  const markAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      onUnreadChange?.(0)
    } catch {
      // keep current state
    }
  }

  const openItem = async (notif) => {
    try {
      if (!notif.read) {
        await adminApi.markNotificationRead(notif.id)
        setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
        onUnreadChange?.(Math.max(0, unreadCount - 1))
      }
    } catch {
      // still navigate
    }
    onClose()
    if (notif.link) navigate(notif.link)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Notifications">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        aria-label="Close notifications"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Notifications</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
              >
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                Mark all read
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Loading...</p>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Bell className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <p className="mt-4 text-sm font-medium text-slate-800">No notifications yet</p>
              <p className="mt-1 text-sm text-slate-500">
                New pending businesses and reviews will show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    onClick={() => openItem(notif)}
                    className={`flex w-full gap-3 px-5 py-4 text-left transition hover:bg-slate-50 ${
                      notif.read ? 'bg-white' : 'bg-primary-50/40'
                    }`}
                  >
                    <NotificationIcon type={notif.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-sm ${
                            notif.read ? 'font-medium text-slate-800' : 'font-semibold text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.read ? (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{notif.message}</p>
                      <p className="mt-2 text-xs text-slate-400">{relativeTime(notif.created_at)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
