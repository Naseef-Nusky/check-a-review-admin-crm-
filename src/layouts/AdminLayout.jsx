import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  Flag,
  FolderTree,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PanelsTopLeft,
  Receipt,
  Settings,
  Shield,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { NavIcon } from '../components/AppIcon'
import { PageHeaderProvider } from '../components/PageHeader'
import NotificationPanel, { NotificationBell } from '../components/NotificationPanel'
import { adminApi } from '../services/api'
import { crmRoleLabel } from '../utils/constants'
import { CRM_BADGES_REFRESH } from '../utils/crmEvents'

const sidebarLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/staff', label: 'CRM Team', icon: Shield },
  { to: '/businesses', label: 'Businesses', icon: Building2, end: true },
  { to: '/pending-businesses', label: 'Pending businesses', icon: AlertTriangle, badgeKey: 'pendingBusinesses' },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/flagged', label: 'Pending reviews', icon: AlertTriangle, badgeKey: 'pendingReviews' },
  { to: '/reports', label: 'Review reports', icon: Flag, badgeKey: 'openReports' },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/payments', label: 'Payments', icon: Receipt },
  { to: '/billing-plans', label: 'Billing plans', icon: WalletCards },
  { to: '/widget-designs', label: 'Widget designs', icon: PanelsTopLeft },
  { to: '/pricing', label: 'Pricing CMS', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const headerBg = {
  backgroundImage:
    'radial-gradient(circle at 20% 0%, rgba(255, 64, 129, 0.35), transparent 45%), linear-gradient(180deg, #0f172a 0%, #111827 100%)',
}

function formatBadgeCount(count) {
  const value = Number(count) || 0
  if (value <= 0) return null
  return value > 99 ? '99+' : String(value)
}

function SidebarNav({ onNavigate, badges = {} }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {sidebarLinks.map((link) => {
        const badge = link.badgeKey ? formatBadgeCount(badges[link.badgeKey]) : null
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <NavIcon icon={link.icon} />
            <span className="min-w-0 flex-1 truncate">{link.label}</span>
            {badge ? (
              <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-semibold leading-none text-white">
                {badge}
              </span>
            ) : null}
          </NavLink>
        )
      })}
    </nav>
  )
}

function SidebarAccount({ user, isViewer, onLogout }) {
  return (
    <div className="shrink-0 border-t border-border p-4">
      <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
      <p className="truncate text-xs text-ink-muted">{user?.email}</p>
      <p className="mt-1 text-xs font-medium text-primary-600">{crmRoleLabel(user?.role)}</p>
      {isViewer ? <p className="mt-1 text-xs text-slate-500">Read-only access</p> : null}
      <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4 stroke-[1.5]" strokeWidth={1.5} aria-hidden="true" />
        Logout
      </Button>
    </div>
  )
}

function AdminShell({ setHeaderSlot }) {
  const { user, logout, isViewer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [navBadges, setNavBadges] = useState({
    pendingBusinesses: 0,
    pendingReviews: 0,
    openReports: 0,
  })

  const refreshUnread = useCallback(async () => {
    try {
      const data = await adminApi.getUnreadNotificationCount()
      setUnreadCount(data?.count || 0)
    } catch {
      // ignore polling errors
    }
  }, [])

  const refreshNavBadges = useCallback(async () => {
    try {
      const [stats, reports] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getReports().catch(() => []),
      ])
      const openReports = Array.isArray(reports) ? reports.filter((r) => r.status === 'open').length : 0
      setNavBadges({
        pendingBusinesses: Number(stats?.pendingBusinesses) || 0,
        pendingReviews: Number(stats?.flaggedReviews) || 0,
        openReports,
      })
    } catch {
      // ignore polling errors
    }
  }, [])

  const syncNotificationsForRoute = useCallback(async () => {
    const path = location.pathname
    try {
      if (path === '/pending-businesses') {
        await adminApi.markNotificationsReadByType('pending_business')
        await refreshUnread()
      } else if (path === '/flagged') {
        await adminApi.markNotificationsReadByType('pending_review')
        await refreshUnread()
      } else if (path === '/reports') {
        await adminApi.markNotificationsReadByType('review_report')
        await refreshUnread()
      }
    } catch {
      // ignore sync errors
    }
  }, [location.pathname, refreshUnread])

  useEffect(() => {
    refreshUnread()
    refreshNavBadges()
    const timer = setInterval(() => {
      refreshUnread()
      refreshNavBadges()
    }, 30000)
    const onRefresh = () => {
      refreshUnread()
      refreshNavBadges()
    }
    const onFocus = () => {
      refreshUnread()
      refreshNavBadges()
    }
    window.addEventListener(CRM_BADGES_REFRESH, onRefresh)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener(CRM_BADGES_REFRESH, onRefresh)
      window.removeEventListener('focus', onFocus)
    }
  }, [refreshUnread, refreshNavBadges])

  useEffect(() => {
    setMobileNavOpen(false)
    let cancelled = false
    const sync = async () => {
      await syncNotificationsForRoute()
      if (!cancelled) refreshNavBadges()
    }
    sync()
    return () => {
      cancelled = true
    }
  }, [location.pathname, refreshNavBadges, syncNotificationsForRoute])

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-shell min-h-screen bg-surface-muted lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-[1920px] flex-col lg:h-full lg:min-h-0">
        <header className="sticky top-0 z-40 shrink-0 border-b border-slate-800" style={headerBg}>
          <div className="flex items-start gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-0">
            <div className="hidden w-72 shrink-0 items-center gap-3 border-r border-white/10 px-6 py-1 lg:flex">
              <Link to="/" className="inline-flex shrink-0">
                <img src="/logo-check-a-review.png" alt="Check A Review" className="h-8 w-auto object-contain" />
              </Link>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">Admin CRM</p>
            </div>

            <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-4 lg:px-8">
              <button
                type="button"
                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-200 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-3 lg:hidden">
                  <Link to="/" className="inline-flex shrink-0">
                    <img src="/logo-check-a-review.png" alt="Check A Review" className="h-7 w-auto object-contain" />
                  </Link>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-300">Admin CRM</p>
                </div>
                <div ref={setHeaderSlot} className="min-h-[3.5rem] sm:min-h-[4.5rem]" />
              </div>

              <div className="shrink-0 pt-1">
                <NotificationBell
                  unreadCount={unreadCount}
                  onClick={() => setNotificationsOpen(true)}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 lg:overflow-hidden">
          <aside className="hidden w-72 shrink-0 border-r border-border bg-white lg:flex lg:max-h-full lg:flex-col lg:overflow-hidden">
            <SidebarNav badges={navBadges} />
            <SidebarAccount user={user} isViewer={isViewer} onLogout={handleLogout} />
          </aside>

          <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:overflow-y-auto lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <img src="/logo-check-a-review.png" alt="" className="h-7 w-auto object-contain" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Menu</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <SidebarNav badges={navBadges} onNavigate={() => setMobileNavOpen(false)} />
            <SidebarAccount user={user} isViewer={isViewer} onLogout={handleLogout} />
          </aside>
        </div>
      ) : null}

      <NotificationPanel
        open={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false)
          refreshUnread()
          refreshNavBadges()
        }}
        onUnreadChange={(count) => {
          setUnreadCount(count)
          refreshNavBadges()
        }}
      />
    </div>
  )
}

export default function AdminLayout() {
  return (
    <PageHeaderProvider>
      {(setHeaderSlot) => <AdminShell setHeaderSlot={setHeaderSlot} />}
    </PageHeaderProvider>
  )
}
