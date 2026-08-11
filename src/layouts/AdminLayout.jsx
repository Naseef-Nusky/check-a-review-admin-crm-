import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  FolderTree,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Receipt,
  Settings,
  Shield,
  Users,
  WalletCards,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { NavIcon } from '../components/AppIcon'
import { PageHeaderProvider } from '../components/PageHeader'
import NotificationPanel, { NotificationBell } from '../components/NotificationPanel'
import { adminApi } from '../services/api'
import { crmRoleLabel } from '../utils/constants'

const sidebarLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/staff', label: 'CRM Team', icon: Shield },
  { to: '/businesses', label: 'Businesses', icon: Building2, end: true },
  { to: '/pending-businesses', label: 'Pending businesses', icon: AlertTriangle },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/flagged', label: 'Pending reviews', icon: AlertTriangle },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/payments', label: 'Payments', icon: Receipt },
  { to: '/billing-plans', label: 'Billing plans', icon: WalletCards },
  { to: '/pricing', label: 'Pricing CMS', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const headerBg = {
  backgroundImage:
    'radial-gradient(circle at 20% 0%, rgba(255, 64, 129, 0.35), transparent 45%), linear-gradient(180deg, #0f172a 0%, #111827 100%)',
}

function AdminShell({ setHeaderSlot }) {
  const { user, logout, isViewer } = useAuth()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(async () => {
    try {
      const data = await adminApi.getUnreadNotificationCount()
      setUnreadCount(data?.count || 0)
    } catch {
      // ignore polling errors
    }
  }, [])

  useEffect(() => {
    refreshUnread()
    const timer = setInterval(refreshUnread, 30000)
    return () => clearInterval(timer)
  }, [refreshUnread])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-shell min-h-screen bg-surface-muted">
      <div className="mx-auto flex min-h-screen w-full max-w-[1920px] flex-col">
        <header className="flex border-b border-slate-800" style={headerBg}>
          <div className="hidden w-72 shrink-0 items-center gap-3 border-r border-white/10 px-6 py-4 lg:flex">
            <Link to="/" className="inline-flex shrink-0">
              <img src="/logo-check-a-review.png" alt="Check A Review" className="h-8 w-auto object-contain" />
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">Admin CRM</p>
          </div>
          <div className="flex min-w-0 flex-1 items-start gap-4 px-6 py-4 sm:px-8">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-3 lg:hidden">
                <Link to="/" className="inline-flex shrink-0">
                  <img src="/logo-check-a-review.png" alt="Check A Review" className="h-7 w-auto object-contain" />
                </Link>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">Admin CRM</p>
              </div>
              <div ref={setHeaderSlot} className="min-h-[4.5rem]" />
            </div>
            <div className="shrink-0 pt-1">
              <NotificationBell
                unreadCount={unreadCount}
                onClick={() => setNotificationsOpen(true)}
              />
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-72 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
            <nav className="flex-1 space-y-1 p-4">
              {sidebarLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `sidebar-link flex items-center gap-3 ${isActive ? 'sidebar-link-active' : ''}`
                  }
                >
                  <NavIcon icon={link.icon} />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-muted">{user?.email}</p>
              <p className="mt-1 text-xs font-medium text-primary-600">{crmRoleLabel(user?.role)}</p>
              {isViewer && (
                <p className="mt-1 text-xs text-slate-500">Read-only access</p>
              )}
              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 stroke-[1.5]" strokeWidth={1.5} aria-hidden="true" />
                Logout
              </Button>
            </div>
          </aside>

          <main className="min-w-0 flex-1 p-6 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <NotificationPanel
        open={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false)
          refreshUnread()
        }}
        onUnreadChange={setUnreadCount}
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
