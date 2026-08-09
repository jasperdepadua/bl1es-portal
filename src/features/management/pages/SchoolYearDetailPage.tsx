import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Power,
  RotateCcw,
  BadgeCheck,
  CalendarRange,
  ChevronRight,
  ArrowLeft,
  Pencil,
  Plus,
} from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'
import { Badge } from '../components/badge'
import { ConfirmDialog } from '../components/confirm-dialog'
import { FormDialog, FORM_INPUT_CLASSNAME, FORM_FIELD_ERROR_CLASSNAME } from '../components/form-dialog'
import { useSchoolYearDetail } from '../hooks/use-school-year-detail'
import { useSetCurrentSchoolYear } from '../hooks/use-set-current-school-year'
import { useCreateGradingPeriod } from '../hooks/use-create-grading-period'
import { useUpdateGradingPeriod } from '../hooks/use-update-grading-period'
import { useDeactivateGradingPeriod } from '../hooks/use-deactivate-grading-period'
import { useReactivateGradingPeriod } from '../hooks/use-reactivate-grading-period'
import type { GradingPeriod, SchoolYearDetail } from '../api/get-school-year-detail'

const gradingPeriodColumns = ['Label', 'Sequence', 'Start Date', 'End Date', 'Status', '']

const gradingPeriodFormSchema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  // The number input is registered with `valueAsNumber: true` (not `z.coerce.number()`), so the
  // resolver's input and output types stay aligned — z.coerce's differing input/output types
  // otherwise conflict with react-hook-form's single generic for a resolver.
  sequence: z.number().int('Sequence must be a whole number').min(1, 'Sequence must be at least 1'),
  startDate: z.string(),
  endDate: z.string(),
})

type GradingPeriodFormValues = z.infer<typeof gradingPeriodFormSchema>

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function GradingPeriodDialog({
  schoolYearId,
  editing,
  defaultSequence,
  onClose,
}: {
  schoolYearId: string
  editing: GradingPeriod | null
  defaultSequence: number
  onClose: () => void
}) {
  const createMutation = useCreateGradingPeriod(schoolYearId)
  const updateMutation = useUpdateGradingPeriod(schoolYearId)
  const mutation = editing ? updateMutation : createMutation

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GradingPeriodFormValues>({
    resolver: zodResolver(gradingPeriodFormSchema),
    defaultValues: editing
      ? {
          label: editing.label,
          sequence: editing.sequence,
          startDate: editing.startDate ?? '',
          endDate: editing.endDate ?? '',
        }
      : { label: '', sequence: defaultSequence, startDate: '', endDate: '' },
  })

  function onSubmit(values: GradingPeriodFormValues) {
    const startDate = values.startDate ? values.startDate : null
    const endDate = values.endDate ? values.endDate : null

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, label: values.label, sequence: values.sequence, startDate, endDate },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(
        { schoolYearId, label: values.label, sequence: values.sequence, startDate, endDate },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <FormDialog
      title={editing ? 'Edit Grading Period' : 'Add Grading Period'}
      description="Grading periods (terms) divide this school year for progress reporting."
      isSaving={mutation.isPending}
      error={mutation.isError ? "Couldn't save this grading period. Please try again." : null}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      saveLabel={editing ? 'Save Changes' : 'Add Grading Period'}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gp-label" className="text-sm font-bold text-foreground">
            Label
          </label>
          <input
            id="gp-label"
            type="text"
            placeholder="Term 1"
            className={FORM_INPUT_CLASSNAME}
            {...register('label')}
          />
          {errors.label && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.label.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gp-sequence" className="text-sm font-bold text-foreground">
            Sequence
          </label>
          <input
            id="gp-sequence"
            type="number"
            min={1}
            step={1}
            className={FORM_INPUT_CLASSNAME}
            {...register('sequence', { valueAsNumber: true })}
          />
          {errors.sequence && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.sequence.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gp-start" className="text-sm font-bold text-foreground">
            Start Date <span className="font-medium text-muted-foreground">(optional)</span>
          </label>
          <input
            id="gp-start"
            type="date"
            className={FORM_INPUT_CLASSNAME}
            {...register('startDate')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gp-end" className="text-sm font-bold text-foreground">
            End Date <span className="font-medium text-muted-foreground">(optional)</span>
          </label>
          <input id="gp-end" type="date" className={FORM_INPUT_CLASSNAME} {...register('endDate')} />
        </div>
      </div>
    </FormDialog>
  )
}

function SchoolYearDetailContent({
  schoolYearId,
  schoolYear,
}: {
  schoolYearId: string
  schoolYear: SchoolYearDetail
}) {
  const [setCurrentTarget, setSetCurrentTarget] = useState(false)
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<GradingPeriod | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<GradingPeriod | null>(null)

  const setCurrentMutation = useSetCurrentSchoolYear(schoolYearId)
  const deactivatePeriodMutation = useDeactivateGradingPeriod(schoolYearId)
  const reactivatePeriodMutation = useReactivateGradingPeriod(schoolYearId)

  const sortedPeriods = [...schoolYear.gradingPeriods].sort((a, b) => a.sequence - b.sequence)
  const nextSequence =
    sortedPeriods.length === 0 ? 1 : Math.max(...sortedPeriods.map((p) => p.sequence)) + 1

  function closeSetCurrentDialog() {
    setSetCurrentTarget(false)
    setCurrentMutation.reset()
  }
  function openCreatePeriodDialog() {
    setEditingPeriod(null)
    setPeriodDialogOpen(true)
  }
  function openEditPeriodDialog(period: GradingPeriod) {
    setEditingPeriod(period)
    setPeriodDialogOpen(true)
  }
  function closePeriodDialog() {
    setPeriodDialogOpen(false)
    setEditingPeriod(null)
  }
  function closeDeactivateDialog() {
    setDeactivateTarget(null)
    deactivatePeriodMutation.reset()
  }

  return (
    <PortalShell
      title={schoolYear.label}
      subtitle="Manage this school year's dates, current status, and grading periods."
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <li>
            <Link
              to="/management/school-years"
              className="rounded-md px-1 py-0.5 transition-colors hover:text-foreground"
            >
              Management
            </Link>
          </li>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
          <li>
            <Link
              to="/management/school-years"
              className="rounded-md px-1 py-0.5 transition-colors hover:text-foreground"
            >
              School Years
            </Link>
          </li>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
          <li aria-current="page" className="px-1 text-foreground">
            {schoolYear.label}
          </li>
        </ol>
      </nav>

      {/* Header card */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {schoolYear.label}
              </h2>
              {schoolYear.isCurrent && <Badge tone="success">Current</Badge>}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarRange className="size-4 text-muted-foreground" aria-hidden />
              {formatDate(schoolYear.startDate)} – {formatDate(schoolYear.endDate)}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {!schoolYear.isCurrent && (
              <button
                type="button"
                onClick={() => setSetCurrentTarget(true)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <BadgeCheck className="size-4" aria-hidden />
                Set as Current
              </button>
            )}
            <Link
              to="/management/school-years"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to School Years
            </Link>
          </div>
        </div>
      </section>

      {/* Grading periods */}
      <section className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-extrabold text-foreground">
            Grading Periods
          </h3>
          <button
            type="button"
            onClick={openCreatePeriodDialog}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Grading Period
          </button>
        </div>

        {sortedPeriods.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarRange className="size-7" aria-hidden />
            </span>
            <div>
              <p className="font-display text-lg font-extrabold text-foreground">
                No grading periods yet
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Add this year's terms (e.g. Term 1, Term 2, Term 3) to enable progress reporting.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreatePeriodDialog}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden />
              Add Grading Period
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {gradingPeriodColumns.map((h, i) => (
                      <th
                        key={h || i}
                        scope="col"
                        className={cn(
                          'px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground',
                          i === gradingPeriodColumns.length - 1 && 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods.map((period) => (
                    <tr
                      key={period.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-5 py-3.5 text-sm font-bold text-foreground">
                        {period.label}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-muted-foreground">
                        {period.sequence}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                        {formatDate(period.startDate)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                        {formatDate(period.endDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        {period.isActive ? (
                          <Badge tone="success">Active</Badge>
                        ) : (
                          <Badge tone="muted">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditPeriodDialog(period)}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Edit ${period.label}`}
                            title="Edit Grading Period"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          {period.isActive ? (
                            <button
                              type="button"
                              onClick={() => setDeactivateTarget(period)}
                              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Deactivate ${period.label}`}
                              title="Deactivate Grading Period"
                            >
                              <Power className="size-4" aria-hidden />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => reactivatePeriodMutation.mutate(period.id)}
                              disabled={reactivatePeriodMutation.isPending}
                              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                              aria-label={`Activate ${period.label}`}
                              title="Activate Grading Period"
                            >
                              <RotateCcw className="size-4" aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Dialogs */}
      {setCurrentTarget && (
        <ConfirmDialog
          title="Set as Current School Year?"
          description={`Set ${schoolYear.label} as the current school year? This will replace the current year for the whole school.`}
          confirmLabel="Set as Current"
          tone="primary"
          isPending={setCurrentMutation.isPending}
          errorMessage={
            setCurrentMutation.isError
              ? "Couldn't set this school year as current. Please try again."
              : undefined
          }
          onCancel={closeSetCurrentDialog}
          onConfirm={() => {
            setCurrentMutation.mutate(schoolYearId, { onSuccess: closeSetCurrentDialog })
          }}
        />
      )}

      {periodDialogOpen && (
        <GradingPeriodDialog
          schoolYearId={schoolYearId}
          editing={editingPeriod}
          defaultSequence={nextSequence}
          onClose={closePeriodDialog}
        />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate Grading Period?"
          description={`${deactivateTarget.label} will be marked inactive and hidden from new records. Historical records referencing it are preserved.`}
          confirmLabel="Deactivate"
          isPending={deactivatePeriodMutation.isPending}
          errorMessage={
            deactivatePeriodMutation.isError
              ? "Couldn't deactivate this grading period. Please try again."
              : undefined
          }
          onCancel={closeDeactivateDialog}
          onConfirm={() => {
            deactivatePeriodMutation.mutate(deactivateTarget.id, {
              onSuccess: closeDeactivateDialog,
            })
          }}
        />
      )}
    </PortalShell>
  )
}

export default function SchoolYearDetailPage() {
  const { schoolYearId } = useParams<{ schoolYearId: string }>()
  const detailQuery = useSchoolYearDetail(schoolYearId)

  if (detailQuery.isLoading) {
    return (
      <PortalShell title="School Year Detail" subtitle="Loading school year…">
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading school year…
        </div>
      </PortalShell>
    )
  }

  if (detailQuery.isError || !detailQuery.data || !schoolYearId) {
    return (
      <PortalShell title="School year not found" subtitle="This school year may have been removed.">
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-extrabold text-foreground">
            School year not found
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            It may have been removed, or the link is incorrect.
          </p>
          <Link
            to="/management/school-years"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to School Years
          </Link>
        </div>
      </PortalShell>
    )
  }

  return <SchoolYearDetailContent schoolYearId={schoolYearId} schoolYear={detailQuery.data} />
}
