import { useId, useState } from 'react'
import { UserCog, ShieldCheck, Camera, Check, Info } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { useProfile } from '@/features/auth/hooks/use-profile'
import { ROLE_LABELS } from '@/features/auth/role-labels'
import { cn } from '@/lib/utils'

type SectionKey = 'profile' | 'security'

const sections: { key: SectionKey; label: string; icon: typeof UserCog }[] = [
  { key: 'profile', label: 'Profile', icon: UserCog },
  { key: 'security', label: 'Security', icon: ShieldCheck },
]

function Field({
  label,
  defaultValue,
  placeholder,
  type = 'text',
  className,
}: {
  label: string
  defaultValue?: string
  placeholder?: string
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
        placeholder={placeholder}
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
  const roleLabel = profile ? ROLE_LABELS[profile.role] : ''

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
              <h2 className="font-display text-lg font-extrabold text-foreground">
                Profile
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                This information is visible to school staff.
              </p>

              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative">
                  <span className="flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-extrabold text-primary-foreground">
                    {initials}
                  </span>
                  <button
                    type="button"
                    disabled
                    title="Changing your photo isn't available yet"
                    className="absolute -bottom-1 -right-1 flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Change photo"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>
                <div>
                  <p className="font-display text-lg font-extrabold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">{roleLabel}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field
                  key={`first-name-${profile?.firstName ?? ''}`}
                  label="First Name"
                  defaultValue={profile?.firstName}
                  placeholder="Not set yet"
                />
                <Field
                  key={`last-name-${profile?.lastName ?? ''}`}
                  label="Last Name"
                  defaultValue={profile?.lastName}
                  placeholder="Not set yet"
                />
                <Field label="Email" placeholder="Not set yet" type="email" />
                <Field label="Contact Number" placeholder="Not set yet" />
              </div>

              <div className="mt-4 flex flex-col gap-1.5">
                <label htmlFor={aboutId} className="text-sm font-bold text-foreground">
                  About
                </label>
                <textarea
                  id={aboutId}
                  rows={3}
                  placeholder="Not set yet"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </section>
          )}

          {active === 'security' && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-extrabold text-foreground">
                Security
              </h2>
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

          {/* Editing-not-available notice */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Info className="size-5" />
            </span>
            <p className="text-sm font-medium text-muted-foreground">
              Editing your profile isn&apos;t available yet.
            </p>
          </div>

          {/* Save bar */}
          <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled
              title="Not available yet"
              className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
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
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
