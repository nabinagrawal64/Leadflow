import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart2, CalendarCheck, LayoutDashboard, LogOut, Users } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../lib/format'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/follow-ups', label: 'Follow-ups', icon: CalendarCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="spectrum h-[3px]" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-350 items-center gap-10 px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" aria-label="LeadFlow home">
            <Logo />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden h-full items-stretch gap-1 md:flex" aria-label="Main">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'relative flex items-center px-3.5 text-sm font-semibold transition-colors duration-150',
                    isActive
                      ? 'text-ink after:absolute after:inset-x-3.5 after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-primary'
                      : 'text-muted hover:text-ink',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <div className="ml-1 hidden items-center gap-2.5 sm:flex">
              <span
                className="flex size-9 items-center justify-center rounded-full bg-sunk text-xs font-bold text-ink ring-1 ring-line"
                aria-hidden
              >
                {initials(user?.name)}
              </span>
              <span className="max-w-[140px] truncate text-sm font-semibold text-ink">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex size-10 items-center justify-center rounded-[10px] text-muted transition-colors hover:bg-sunk hover:text-ink"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-350 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Main"
      >
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted',
              )
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
