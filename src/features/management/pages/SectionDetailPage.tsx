import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'
import { useModalBehavior } from '@/hooks/use-modal-behavior'
import { Badge } from '../components/badge'
import { Initials } from '../components/initials'
import { useSectionDetail } from '../hooks/use-section-detail'
import { useSectionRoster } from '../hooks/use-section-roster'
import { useEnrollableStudents } from '../hooks/use-enrollable-students'
import { useEnrollStudent } from '../hooks/use-enroll-student'
import { useUnenrollStudent } from '../hooks/use-unenroll-student'
import { useTeachers } from '../hooks/use-teachers'
import { useSetSectionAdviser } from '../hooks/use-set-section-adviser'
import { useSectionSubjectTeachers } from '../hooks/use-section-subject-teachers'
import { useAssignSubjectTeacher } from '../hooks/use-assign-subject-teacher'
import type { SectionDetail } from '../api/get-section-detail'
import type { RosterEntry } from '../api/get-section-roster'
import type { SubjectTeacherRow } from '../api/get-section-subject-teachers'

type TabKey = 'roster' | 'adviser' | 'subjects'

const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: 'roster', label: 'Roster', icon: Users },
  { key: 'adviser', label: 'Adviser', icon: Mail },
  { key: 'subjects', label: 'Subject Teachers', icon: BookOpen },
]

// Stable empty-array reference so a still-loading roster doesn't defeat useMemo below.
const EMPTY_ROSTER: RosterEntry[] = []

function PickerDialog<T extends { id: string; name: string }>({
  title,
  description,
  onClose,
  isLoading,
  options,
  emptyMessage,
  renderSubtitle,
  onSelect,
  isSelecting,
  errorMessage,
}: {
  title: string
  description: string
  onClose: () => void
  isLoading: boolean
  options: T[]
  emptyMessage: string
  renderSubtitle?: (option: T) => string | null
  onSelect: (option: T) => void
  isSelecting: boolean
  errorMessage?: string
}) {
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  useModalBehavior(containerRef, onClose)

  const filtered = useMemo(
    () => options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h3 className="font-display text-lg font-extrabold text-foreground">{title}</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="border-b border-border p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name..."
              className="h-11 w-full rounded-2xl border border-border bg-background pl-9 pr-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30"
              aria-label="Search by name"
            />
          </div>
          {errorMessage && (
            <p className="mt-3 text-sm font-semibold text-destructive">{errorMessage}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <p className="px-3 py-8 text-center text-sm font-medium text-muted-foreground">
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm font-medium text-muted-foreground">
              {options.length === 0 ? emptyMessage : 'No matches found.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((option) => {
                const subtitle = renderSubtitle?.(option)
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      disabled={isSelecting}
                      onClick={() => onSelect(option)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Initials name={option.name} className="size-9 shrink-0 text-xs" />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-bold text-foreground">{option.name}</p>
                        {subtitle && (
                          <p className="truncate text-xs font-semibold text-muted-foreground">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel: string
  isPending: boolean
  errorMessage?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useModalBehavior(containerRef, onCancel)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onCancel} aria-hidden />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl"
      >
        <h3 className="font-display text-lg font-extrabold text-foreground">{title}</h3>
        <p className="mt-2 text-sm font-medium text-muted-foreground">{description}</p>
        {errorMessage && (
          <p className="mt-3 text-sm font-semibold text-destructive">{errorMessage}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="cursor-pointer rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm font-extrabold text-destructive transition-colors hover:bg-destructive/20 disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionDetailContent({
  sectionId,
  section,
}: {
  sectionId: string
  section: SectionDetail
}) {
  const [active, setActive] = useState<TabKey>('roster')
  const [query, setQuery] = useState('')
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [adviserDialogOpen, setAdviserDialogOpen] = useState(false)
  const [subjectDialogFor, setSubjectDialogFor] = useState<SubjectTeacherRow | null>(null)
  const [unenrollTarget, setUnenrollTarget] = useState<RosterEntry | null>(null)

  const rosterQuery = useSectionRoster(sectionId)
  const subjectTeachersQuery = useSectionSubjectTeachers(sectionId, section.gradeLevelId)
  const enrollableStudentsQuery = useEnrollableStudents(section.schoolYearId, enrollDialogOpen)
  const teachersQuery = useTeachers(adviserDialogOpen || subjectDialogFor !== null)

  const enrollMutation = useEnrollStudent(sectionId, section.schoolYearId)
  const unenrollMutation = useUnenrollStudent(sectionId, section.schoolYearId)
  const setAdviserMutation = useSetSectionAdviser(sectionId)
  const assignSubjectTeacherMutation = useAssignSubjectTeacher(sectionId)

  const roster = rosterQuery.data ?? EMPTY_ROSTER
  const filteredRoster = useMemo(
    () => roster.filter((s) => s.studentName.toLowerCase().includes(query.trim().toLowerCase())),
    [roster, query],
  )
  const subjectTeachers = subjectTeachersQuery.data ?? []

  function closeEnrollDialog() {
    setEnrollDialogOpen(false)
    enrollMutation.reset()
  }
  function closeAdviserDialog() {
    setAdviserDialogOpen(false)
    setAdviserMutation.reset()
  }
  function closeSubjectDialog() {
    setSubjectDialogFor(null)
    assignSubjectTeacherMutation.reset()
  }
  function closeUnenrollDialog() {
    setUnenrollTarget(null)
    unenrollMutation.reset()
  }

  return (
    <PortalShell
      title="Section Detail"
      subtitle="Manage this section's roster, adviser, and subject teachers."
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <li>
            <Link
              to="/management/sections"
              className="rounded-md px-1 py-0.5 transition-colors hover:text-foreground"
            >
              Management
            </Link>
          </li>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
          <li>
            <Link
              to="/management/sections"
              className="rounded-md px-1 py-0.5 transition-colors hover:text-foreground"
            >
              Sections
            </Link>
          </li>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
          <li aria-current="page" className="px-1 text-foreground">
            {section.name}
          </li>
        </ol>
      </nav>

      {/* Header card */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {section.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{section.gradeLevelName}</Badge>
                <Badge tone="secondary">{section.schoolYearLabel}</Badge>
                {section.shift && (
                  <Badge tone="muted">
                    <Clock className="size-3" aria-hidden />
                    {section.shift} Shift
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2.5">
                <Initials name={section.adviserName ?? '?'} className="size-9 text-xs" />
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-muted-foreground">Adviser</p>
                  <p className="text-sm font-bold text-foreground">
                    {section.adviserName ?? 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Users className="size-4 text-muted-foreground" aria-hidden />
                {section.enrolledCount} student{section.enrolledCount === 1 ? '' : 's'} enrolled
              </div>
            </div>
          </div>

          <Link
            to="/management/sections"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Sections
          </Link>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Section management"
          className="mt-6 flex gap-1 border-b border-border"
        >
          {tabs.map((t) => {
            const Icon = t.icon
            const isActive = active === t.key
            return (
              <button
                key={t.key}
                type="button"
                id={`section-tab-${t.key}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`section-tabpanel-${t.key}`}
                onClick={() => setActive(t.key)}
                className={cn(
                  'relative -mb-px inline-flex cursor-pointer items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Tab panels */}
      <div className="mt-6">
        {active === 'roster' && (
          <section
            id="section-tabpanel-roster"
            role="tabpanel"
            aria-labelledby="section-tab-roster"
            tabIndex={0}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by student name..."
                  className="h-11 w-full rounded-2xl border border-border bg-card pl-9 pr-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30 sm:w-72"
                  aria-label="Filter by student name"
                />
              </div>

              <button
                type="button"
                onClick={() => setEnrollDialogOpen(true)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <UserPlus className="size-4" aria-hidden />
                Enroll Student
              </button>
            </div>

            {rosterQuery.isLoading ? (
              <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
                Loading roster…
              </div>
            ) : rosterQuery.isError ? (
              <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive">
                Couldn&apos;t load the roster. Try refreshing the page.
              </div>
            ) : roster.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="size-7" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-lg font-extrabold text-foreground">
                    No students enrolled yet
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Enroll your first student to get started.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnrollDialogOpen(true)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <UserPlus className="size-4" aria-hidden />
                  Enroll Student
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {['Name', 'Student Number', 'Guardian', 'Status', ''].map((h, i) => (
                          <th
                            key={h || i}
                            scope="col"
                            className={cn(
                              'px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground',
                              i === 4 && 'text-right',
                            )}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoster.map((s) => (
                        <tr
                          key={s.enrollmentId}
                          className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Initials name={s.studentName} className="size-9 text-xs" />
                              <span className="text-sm font-bold text-foreground">
                                {s.studentName}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-sm font-semibold text-muted-foreground">
                              {s.studentNumber}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                            {s.guardianName ?? '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            {s.isActive ? (
                              <Badge tone="success">Active</Badge>
                            ) : (
                              <Badge tone="muted">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setUnenrollTarget(s)}
                              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Unenroll ${s.studentName}`}
                              title="Unenroll student"
                            >
                              <UserMinus className="size-4" aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRoster.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-10 text-center text-sm font-medium text-muted-foreground"
                          >
                            No students match &quot;{query}&quot;.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {active === 'adviser' && (
          <section
            id="section-tabpanel-adviser"
            role="tabpanel"
            aria-labelledby="section-tab-adviser"
            tabIndex={0}
            className="flex flex-col gap-4"
          >
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Initials name={section.adviserName ?? '?'} className="size-16 text-xl" />
                  <div className="leading-tight">
                    <p className="font-display text-xl font-extrabold text-foreground">
                      {section.adviserName ?? 'No adviser assigned'}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                      Section Adviser · {section.gradeLevelName} {section.name}
                    </p>
                    {section.adviserContactEmail && (
                      <a
                        href={`mailto:${section.adviserContactEmail}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                      >
                        <Mail className="size-4" aria-hidden />
                        {section.adviserContactEmail}
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAdviserDialogOpen(true)}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                >
                  <RefreshCw className="size-4" aria-hidden />
                  {section.adviserId ? 'Change Adviser' : 'Assign Adviser'}
                </button>
              </div>
            </div>
            <p className="px-1 text-sm font-medium text-muted-foreground">
              The adviser has full access to this section&apos;s roster, attendance, and records.
            </p>
          </section>
        )}

        {active === 'subjects' && (
          <section
            id="section-tabpanel-subjects"
            role="tabpanel"
            aria-labelledby="section-tab-subjects"
            tabIndex={0}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-medium text-muted-foreground">
              Subject-teacher assignments for this section.
            </p>

            {subjectTeachersQuery.isLoading ? (
              <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
                Loading subjects…
              </div>
            ) : subjectTeachersQuery.isError ? (
              <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive">
                Couldn&apos;t load subject teachers. Try refreshing the page.
              </div>
            ) : subjectTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-7" aria-hidden />
                </span>
                <div className="max-w-md">
                  <p className="font-display text-lg font-extrabold text-foreground">
                    No discrete subjects for {section.gradeLevelName}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    This grade level uses an integrated curriculum, so all learning areas are
                    handled by the section adviser.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <ul className="divide-y divide-border">
                  {subjectTeachers.map((subject) => (
                    <li
                      key={subject.subjectId}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <BookOpen className="size-5" aria-hidden />
                        </span>
                        <div className="leading-tight">
                          <p className="text-sm font-extrabold text-foreground">
                            {subject.subjectName}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground">
                            {subject.teacherName ?? 'Unassigned — defaults to adviser'}
                          </p>
                        </div>
                      </div>
                      {subject.teacherName ? (
                        <button
                          type="button"
                          onClick={() => setSubjectDialogFor(subject)}
                          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                        >
                          <RefreshCw className="size-3.5" aria-hidden />
                          Change
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSubjectDialogFor(subject)}
                          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                        >
                          <UserPlus className="size-3.5" aria-hidden />
                          Assign
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Dialogs */}
      {enrollDialogOpen && (
        <PickerDialog
          title="Enroll Student"
          description={`Add a registered student to ${section.name} for ${section.schoolYearLabel}.`}
          onClose={closeEnrollDialog}
          isLoading={enrollableStudentsQuery.isLoading}
          options={enrollableStudentsQuery.data ?? []}
          emptyMessage="No registered students are available to enroll yet."
          renderSubtitle={(s) => s.studentNumber}
          isSelecting={enrollMutation.isPending}
          errorMessage={enrollMutation.isError ? "Couldn't enroll this student. Please try again." : undefined}
          onSelect={(student) => {
            enrollMutation.mutate(
              { sectionId, schoolYearId: section.schoolYearId, studentId: student.id },
              { onSuccess: closeEnrollDialog },
            )
          }}
        />
      )}

      {adviserDialogOpen && (
        <PickerDialog
          title={section.adviserId ? 'Change Adviser' : 'Assign Adviser'}
          description="Pick a teacher to advise this section."
          onClose={closeAdviserDialog}
          isLoading={teachersQuery.isLoading}
          options={teachersQuery.data ?? []}
          emptyMessage="No registered teachers are available yet."
          renderSubtitle={(t) => t.contactEmail}
          isSelecting={setAdviserMutation.isPending}
          errorMessage={
            setAdviserMutation.isError ? "Couldn't set the adviser. Please try again." : undefined
          }
          onSelect={(teacher) => {
            setAdviserMutation.mutate(
              { sectionId, adviserId: teacher.id },
              { onSuccess: closeAdviserDialog },
            )
          }}
        />
      )}

      {subjectDialogFor && (
        <PickerDialog
          title={subjectDialogFor.teacherName ? 'Change Subject Teacher' : 'Assign Subject Teacher'}
          description={`Pick a teacher for ${subjectDialogFor.subjectName}.`}
          onClose={closeSubjectDialog}
          isLoading={teachersQuery.isLoading}
          options={teachersQuery.data ?? []}
          emptyMessage="No registered teachers are available yet."
          renderSubtitle={(t) => t.contactEmail}
          isSelecting={assignSubjectTeacherMutation.isPending}
          errorMessage={
            assignSubjectTeacherMutation.isError
              ? "Couldn't assign this teacher. Please try again."
              : undefined
          }
          onSelect={(teacher) => {
            assignSubjectTeacherMutation.mutate(
              { sectionId, subjectId: subjectDialogFor.subjectId, teacherId: teacher.id },
              { onSuccess: closeSubjectDialog },
            )
          }}
        />
      )}

      {unenrollTarget && (
        <ConfirmDialog
          title="Unenroll student?"
          description={`${unenrollTarget.studentName} will be removed from this section's roster. This can't be undone.`}
          confirmLabel="Unenroll"
          isPending={unenrollMutation.isPending}
          errorMessage={
            unenrollMutation.isError ? "Couldn't unenroll this student. Please try again." : undefined
          }
          onCancel={closeUnenrollDialog}
          onConfirm={() => {
            unenrollMutation.mutate(unenrollTarget.enrollmentId, { onSuccess: closeUnenrollDialog })
          }}
        />
      )}
    </PortalShell>
  )
}

export default function SectionDetailPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const detailQuery = useSectionDetail(sectionId)

  if (detailQuery.isLoading) {
    return (
      <PortalShell title="Section Detail" subtitle="Loading section…">
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading section…
        </div>
      </PortalShell>
    )
  }

  if (detailQuery.isError || !detailQuery.data || !sectionId) {
    return (
      <PortalShell title="Section not found" subtitle="This section may have been removed.">
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-extrabold text-foreground">Section not found</p>
          <p className="text-sm font-medium text-muted-foreground">
            It may have been removed, or the link is incorrect.
          </p>
          <Link
            to="/management/sections"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Sections
          </Link>
        </div>
      </PortalShell>
    )
  }

  return <SectionDetailContent sectionId={sectionId} section={detailQuery.data} />
}
