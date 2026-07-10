import { useId, useState } from 'react'
import { UserCog, ShieldCheck, Camera, Check } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { useProfile } from '@/features/auth/hooks/use-profile'
import { cn } from '@/lib/utils'

type SectionKey = 'profile' | 'security'

const sections: { key: SectionKey; label: string; icon: typeof UserCog }[] = [
  { key: 'profile', label: 'Profile', icon: UserCog },
  { key: 'security', label: 'Security', icon: ShieldCheck },
]

function Field({
  label,
  defaultValue,
  type = 'text',
  className,
}: {
  label: string
  defaultValue: string
  type?: string
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-bold text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-3 focus:ring-ring/30"
      />
    </div>
  )
}

export default function SettingsPage() {
  const [active, setActive] = useState<SectionKey>('profile')
  const { data: profile } = useProfile()
  const aboutId = useId()

  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : ''
  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : ''

  return (
    <PortalShell
      title="Settings"
      subtitle="Manage your profile and password."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Section nav */}
        <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-border bg-card p-3 lg:flex-col lg:overflow-visible">
          {sections.map((s) => {
            const Icon = s.icon
            const isActive = active === s.key
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors lg:w-full',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-5" />
                {s.label}
              </button>
            )
          })}
        </nav>

        <div className="flex flex-col gap-6">
          {active === 'profile' && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Profile
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                This information is visible to your class and school staff.
              </p>

              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative">
                  <span className="flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-extrabold text-primary-foreground">
                    {initials}
                  </span>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                    aria-label="Change photo"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>
                <div>
                  <p className="font-display text-lg font-extrabold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    Adviser · Grade 4–Mabini
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="First Name" defaultValue="Maria" />
                <Field label="Last Name" defaultValue="Reyes" />
                <Field label="Email" defaultValue="m.reyes@bl1es.edu.ph" type="email" />
                <Field label="Contact Number" defaultValue="+63 917 555 0142" />
              </div>

              <div className="mt-4 flex flex-col gap-1.5">
                <label htmlFor={aboutId} className="text-sm font-bold text-foreground">
                  About
                </label>
                <textarea
                  id={aboutId}
                  rows={3}
                  defaultValue="I love making learning fun and helping every child shine. I'm the adviser for Grade 4–Mabini."
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </section>
          )}

          {active === 'security' && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Security
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                Update your password.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Current Password" defaultValue="" type="password" />
                <Field
                  label="New Password"
                  defaultValue=""
                  type="password"
                  className="sm:col-start-1"
                />
                <Field label="Confirm New Password" defaultValue="" type="password" />
              </div>
            </section>
          )}

          {/* Save bar */}
          <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="cursor-pointer rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled
              title="Not available yet"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="size-4" />
              Save changes
            </button>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
