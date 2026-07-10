import { useState } from 'react'
import {
  UserCog,
  Bell,
  Palette,
  ShieldCheck,
  Camera,
  Check,
} from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'

type SectionKey = 'profile' | 'notifications' | 'preferences' | 'security'

const sections: { key: SectionKey; label: string; icon: typeof UserCog }[] = [
  { key: 'profile', label: 'Profile', icon: UserCog },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'preferences', label: 'Preferences', icon: Palette },
  { key: 'security', label: 'Security', icon: ShieldCheck },
]

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute top-1 size-5 rounded-full bg-card shadow-sm transition-all',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}

function Field({
  label,
  defaultValue,
  type = 'text',
}: {
  label: string
  defaultValue: string
  type?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-foreground">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-3 focus:ring-ring/30"
      />
    </div>
  )
}

const accents = [
  { name: 'Sky Blue', value: 'var(--primary)' },
  { name: 'Sunny Yellow', value: 'var(--secondary)' },
  { name: 'Coral', value: 'var(--accent)' },
  { name: 'Mint', value: 'var(--chart-4)' },
]

export default function SettingsPage() {
  const [active, setActive] = useState<SectionKey>('profile')
  const [notif, setNotif] = useState({
    assignments: true,
    grades: true,
    announcements: true,
    reminders: false,
    weekly: true,
  })
  const [prefs, setPrefs] = useState({ sound: true, animations: true, biggerText: false })
  const [accent, setAccent] = useState('Sky Blue')

  return (
    <PortalShell
      title="Settings"
      subtitle="Manage your profile, notifications, and portal preferences."
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
                onClick={() => setActive(s.key)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors lg:w-full',
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
                    MR
                  </span>
                  <button
                    className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                    aria-label="Change photo"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>
                <div>
                  <p className="font-display text-lg font-extrabold text-foreground">
                    Ms. Maria Reyes
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    Grade 4 Adviser · Section Mabini
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
                <label className="text-sm font-bold text-foreground">About</label>
                <textarea
                  rows={3}
                  defaultValue="I love making learning fun and helping every child shine. Homeroom adviser for Grade 4 - Mabini."
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </section>
          )}

          {active === 'notifications' && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Notifications
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                Choose what updates you want to receive.
              </p>
              <div className="mt-5 flex flex-col divide-y divide-border">
                {[
                  { key: 'assignments', label: 'New assignments', desc: 'When a new task is posted' },
                  { key: 'grades', label: 'Grade updates', desc: 'When grades are released' },
                  { key: 'announcements', label: 'School announcements', desc: 'News from the school office' },
                  { key: 'reminders', label: 'Daily reminders', desc: 'A friendly nudge each morning' },
                  { key: 'weekly', label: 'Weekly summary', desc: 'A recap every Friday' },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {row.label}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        {row.desc}
                      </p>
                    </div>
                    <Toggle
                      label={row.label}
                      checked={notif[row.key as keyof typeof notif]}
                      onChange={(v) =>
                        setNotif((n) => ({ ...n, [row.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'preferences' && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Preferences
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                Make the portal feel just right for you.
              </p>

              <div className="mt-5">
                <p className="text-sm font-bold text-foreground">Accent color</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {accents.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setAccent(c.name)}
                      className={cn(
                        'flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition-colors',
                        accent === c.name
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span
                        className="flex size-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: c.value }}
                      >
                        {accent === c.name && (
                          <Check className="size-3 text-primary-foreground" />
                        )}
                      </span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col divide-y divide-border">
                {[
                  { key: 'sound', label: 'Sound effects', desc: 'Play cheerful sounds on actions' },
                  { key: 'animations', label: 'Animations', desc: 'Show playful motion around the app' },
                  { key: 'biggerText', label: 'Bigger text', desc: 'Increase text size for readability' },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {row.label}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        {row.desc}
                      </p>
                    </div>
                    <Toggle
                      label={row.label}
                      checked={prefs[row.key as keyof typeof prefs]}
                      onChange={(v) =>
                        setPrefs((p) => ({ ...p, [row.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'security' && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Security
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                Keep your account safe and sound.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Current Password" defaultValue="" type="password" />
                <div className="hidden sm:block" />
                <Field label="New Password" defaultValue="" type="password" />
                <Field label="Confirm New Password" defaultValue="" type="password" />
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Two-step verification
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Add an extra layer of protection to your account.
                  </p>
                </div>
                <span className="rounded-full bg-secondary/50 px-3 py-1 text-xs font-bold text-secondary-foreground">
                  Off
                </span>
              </div>
            </section>
          )}

          {/* Save bar */}
          <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            <button className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted">
              Cancel
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">
              <Check className="size-4" />
              Save changes
            </button>
          </div>
        </div>
      </div>
    </PortalShell>
  )
}
