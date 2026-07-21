import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { NavIcon } from '../components/AppIcon'

const sidebarLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Customers', icon: Users },
  { to: '/businesses', label: 'Businesses', icon: Building2 },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/flagged', label: 'AI Flagged', icon: AlertTriangle },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/payments', label: 'Payments', icon: Receipt },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-shell min-h-screen bg-surface-muted">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
          <div
            className="relative border-b border-border bg-slate-950 px-6 py-5"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 0%, rgba(255, 64, 129, 0.35), transparent 45%), linear-gradient(180deg, #0f172a 0%, #111827 100%)',
            }}
          >
            <div className="relative">
              <div className="mx-auto inline-flex rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                <img src="/logo-check-a-review.png" alt="Check A Review" className="h-7 w-auto object-contain" />
              </div>
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">Admin CRM</p>
            </div>
          </div>
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
  )
}
