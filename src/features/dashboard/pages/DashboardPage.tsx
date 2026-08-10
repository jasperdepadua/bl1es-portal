import {
  BookOpen,
  ClipboardList,
  Trophy,
  CalendarClock,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Calculator,
  FlaskConical,
  Globe2,
  Music,
} from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { useProfile } from '@/features/auth/hooks/use-profile'
import { Badge } from '@/components/badge'
import { cn } from '@/lib/utils'

const stats = [
  {
    label: "Today's Classes",
    value: '5',
    hint: '2 remaining',
    icon: BookOpen,
    tint: 'bg-primary/10 text-primary',
  },
  {
    label: 'Assignments Due',
    value: '3',
    hint: 'This week',
    icon: ClipboardList,
    tint: 'bg-accent/15 text-accent',
  },
  {
    label: 'Attendance',
    value: '98%',
    hint: 'This term',
    icon: CheckCircle2,
    tint: 'bg-chart-4/15 text-success-foreground',
  },
  {
    label: 'Star Points',
    value: '1,240',
    hint: '+80 this week',
    icon: Trophy,
    tint: 'bg-secondary/50 text-secondary-foreground',
  },
]

const subjects = [
  { name: 'Mathematics', teacher: 'Mr. Santos', progress: 82, icon: Calculator, tint: 'bg-primary/10 text-primary' },
  { name: 'Science', teacher: 'Ms. Cruz', progress: 74, icon: FlaskConical, tint: 'bg-chart-4/15 text-success-foreground' },
  { name: 'Reading & Writing', teacher: 'Ms. Reyes', progress: 90, icon: BookOpen, tint: 'bg-accent/15 text-accent' },
  { name: 'Araling Panlipunan', teacher: 'Mr. Dela Cruz', progress: 66, icon: Globe2, tint: 'bg-secondary/50 text-secondary-foreground' },
  { name: 'MAPEH', teacher: 'Mr. Bautista', progress: 88, icon: Music, tint: 'bg-secondary/50 text-secondary-foreground' },
]

const schedule = [
  { time: '8:00 AM', subject: 'Mathematics', room: 'Room 4-A', done: true },
  { time: '9:30 AM', subject: 'Science', room: 'Lab 2', done: true },
  { time: '10:45 AM', subject: 'Reading & Writing', room: 'Room 4-A', done: false, now: true },
  { time: '1:00 PM', subject: 'Arts', room: 'Art Studio', done: false },
  { time: '2:30 PM', subject: 'Music (MAPEH)', room: 'Music Hall', done: false },
]

const tasks = [
  { title: 'Math Workbook pp. 24–26', subject: 'Mathematics', due: 'Due Tomorrow', urgent: true },
  { title: 'Plant Growth Journal', subject: 'Science', due: 'Due in 3 days', urgent: false },
  { title: 'Read "The Kind Turtle"', subject: 'Reading', due: 'Due Friday', urgent: false },
]

export default function DashboardPage() {
  const { data: profile } = useProfile()
  const greeting = profile?.firstName ? `Good morning, ${profile.firstName}!` : 'Good morning!'

  return (
    <PortalShell title="Dashboard" subtitle="Your day at a glance.">
      <div className="flex flex-col gap-6">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-7 text-primary-foreground sm:px-8">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-14 right-24 size-40 rounded-full bg-secondary/20" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">
                <CalendarClock className="size-3.5" />
                Monday, July 13
              </p>
              <h2 className="mt-3 text-balance font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                {greeting}
              </h2>
              <p className="mt-2 font-medium text-primary-foreground/85">
                Keep up the great work — your class is 84% through this term&apos;s goals!
              </p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-primary-foreground px-5 py-3 text-sm font-extrabold text-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              View schedule
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-3xl border border-border bg-card p-5"
              >
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-2xl',
                    stat.tint,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 font-display text-2xl font-extrabold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm font-bold text-foreground">{stat.label}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.hint}
                </p>
              </div>
            )
          })}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Subjects */}
          <section className="rounded-3xl border border-border bg-card p-6 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold text-foreground">
                  My Subjects
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  Class progress this term
                </p>
              </div>
              <button
                type="button"
                disabled
                className="text-sm font-bold text-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                View all
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {subjects.map((subject) => {
                const Icon = subject.icon
                return (
                  <div
                    key={subject.name}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex size-10 items-center justify-center rounded-xl',
                          subject.tint,
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground">
                          {subject.name}
                        </p>
                        <p className="truncate text-xs font-medium text-muted-foreground">
                          {subject.teacher}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-foreground">{subject.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Schedule */}
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Today&apos;s Schedule
              </h3>
              <CalendarClock className="size-5 text-muted-foreground" />
            </div>
            <ol className="flex flex-col gap-3">
              {schedule.map((item) => (
                <li
                  key={item.time}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3',
                    item.now
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl',
                      item.done
                        ? 'bg-chart-4/15 text-success-foreground'
                        : item.now
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {item.done ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <Clock className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {item.subject}
                    </p>
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {item.time} · {item.room}
                    </p>
                  </div>
                  {item.now && (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-foreground">
                      NOW
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Assignments */}
        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Upcoming Assignments
              </h3>
              <p className="text-sm font-medium text-muted-foreground">
                Don&apos;t forget to check these off!
              </p>
            </div>
            <button
              type="button"
              disabled
              className="text-sm font-bold text-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              View all
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {tasks.map((task) => (
              <div
                key={task.title}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex items-center justify-between">
                  <Badge tone="muted">{task.subject}</Badge>
                  <Badge tone={task.urgent ? 'destructive' : 'secondary'}>
                    {task.due}
                  </Badge>
                </div>
                <p className="mt-3 font-bold text-foreground">{task.title}</p>
                <button
                  type="button"
                  disabled
                  className="mt-4 w-full rounded-xl border border-border bg-card py-2 text-sm font-bold text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark as done
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PortalShell>
  )
}
