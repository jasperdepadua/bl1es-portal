import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  MessagesSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand-logo'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Classes', href: '#', icon: BookOpen },
  { label: 'Schedule', href: '#', icon: CalendarDays },
  { label: 'Assignments', href: '#', icon: ClipboardList },
  { label: 'Grades', href: '#', icon: GraduationCap },
  { label: 'Messages', href: '#', icon: MessagesSquare },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/dashboard" className="px-1">
        <BrandLogo />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = item.href !== '#' && pathname === item.href
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
      </nav>

      <div className="rounded-3xl bg-secondary/40 p-4">
        <p className="font-display text-sm font-extrabold text-foreground">
          Need help?
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Ask your teacher or visit the help center anytime.
        </p>
        <button className="mt-3 w-full rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground transition-transform hover:-translate-y-0.5">
          Open Help Center
        </button>
      </div>

      <Link
        to="/"
        className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
      >
        <LogOut className="size-5" />
        Log out
      </Link>
    </div>
  )
}

export function PortalShell({
  children,
  title,
  subtitle,
  user = { name: 'Ms. Reyes', role: 'Grade 4 Teacher', initials: 'MR' },
}: {
  children: ReactNode
  title: string
  subtitle?: string
  user?: { name: string; role: string; initials: string }
}) {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-sidebar lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-sidebar shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent pathname={pathname} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background/85 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex size-10 items-center justify-center rounded-2xl border border-border bg-card text-foreground lg:hidden"
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

          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="h-10 w-48 rounded-2xl border border-border bg-card pl-9 pr-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:w-56 focus:ring-3 focus:ring-ring/40 lg:w-56 lg:focus:w-64"
            />
          </div>

          <button
            className="relative flex size-10 items-center justify-center rounded-2xl border border-border bg-card text-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-accent" />
          </button>

          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground">
              {user.initials}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-bold text-foreground">{user.name}</p>
              <p className="text-xs font-medium text-muted-foreground">
                {user.role}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
