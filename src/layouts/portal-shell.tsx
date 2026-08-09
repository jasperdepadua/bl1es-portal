import { useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Layers,
  BookOpen,
  GraduationCap,
  CalendarRange,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModalBehavior } from '@/hooks/use-modal-behavior'
import { BrandLogo } from '@/components/brand-logo'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { useProfile } from '@/features/auth/hooks/use-profile'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const managementNavItems = [
  { label: 'Sections', href: '/management/sections', icon: Layers },
  { label: 'Subjects', href: '/management/subjects', icon: BookOpen },
  { label: 'Grade Levels', href: '/management/grade-levels', icon: GraduationCap },
  { label: 'School Years', href: '/management/school-years', icon: CalendarRange },
]

const ROLE_LABELS = {
  superadmin: 'Principal',
  admin: 'Teacher',
  normal: 'Student',
} as const

function isNavItemActive(pathname: string, href: string) {
  return href !== '#' && (pathname === href || pathname.startsWith(`${href}/`))
}

function SidebarContent({ pathname, isSuperadmin }: { pathname: string; isSuperadmin: boolean }) {
  const navigate = useNavigate()
  const logout = useLogout()

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/dashboard" className="px-1">
        <BrandLogo />
      </Link>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {isSuperadmin && (
          <div role="group" aria-labelledby="management-nav-heading">
            <p
              id="management-nav-heading"
              className="mt-4 px-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground"
            >
              Management
            </p>
            {managementNavItems.map((item) => {
              const active = isNavItemActive(pathname, item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-bold text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
      >
        <LogOut className="size-5" />
        Sign out
      </button>
    </div>
  )
}

function MobileDrawer({
  pathname,
  isSuperadmin,
  onClose,
}: {
  pathname: string
  isSuperadmin: boolean
  onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useModalBehavior(containerRef, onClose)

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="absolute left-0 top-0 h-full w-72 bg-sidebar shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
        <SidebarContent pathname={pathname} isSuperadmin={isSuperadmin} />
      </div>
    </div>
  )
}

export function PortalShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title: string
  subtitle?: string
}) {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: profile } = useProfile()

  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : ''
  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : ''
  const roleLabel = profile ? ROLE_LABELS[profile.role] : ''
  const isSuperadmin = profile?.role === 'superadmin'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-sidebar lg:block">
        <SidebarContent pathname={pathname} isSuperadmin={isSuperadmin} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <MobileDrawer
          pathname={pathname}
          isSuperadmin={isSuperadmin}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background/85 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-2xl border border-border bg-card text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm font-medium text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            className="relative flex size-10 cursor-pointer items-center justify-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            aria-label="Notifications, 1 unread"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />
          </button>

          <div className="flex items-center gap-3">
            <span
              aria-label={displayName}
              className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground"
            >
              {initials}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-bold text-foreground">{displayName}</p>
              <p className="text-xs font-medium text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
