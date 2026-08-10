import { Fragment, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  ArrowDown,
  ArrowUp,
  GraduationCap,
  Pencil,
  Plus,
  Power,
  RotateCcw,
} from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { InlineMutationError } from '@/components/inline-mutation-error'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/badge'
import { ConfirmDialog } from '../components/confirm-dialog'
import { FormDialog, FORM_INPUT_CLASSNAME, FORM_FIELD_ERROR_CLASSNAME } from '../components/form-dialog'
import { ScrollableTable } from '../components/scrollable-table'
import { useGradeLevels } from '../hooks/use-grade-levels'
import { useCreateGradeLevel } from '../hooks/use-create-grade-level'
import { useUpdateGradeLevel } from '../hooks/use-update-grade-level'
import { useDeactivateGradeLevel } from '../hooks/use-deactivate-grade-level'
import { useReactivateGradeLevel } from '../hooks/use-reactivate-grade-level'
import { useReorderGradeLevels } from '../hooks/use-reorder-grade-levels'
import type { GradeLevelListItem } from '../api/list-grade-levels'

const columns = ['Name', 'Sequence', 'Status', '']

const gradeLevelSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  sequence: z.coerce.number().int().positive('Sequence must be a positive number'),
})

// `sequence` is `z.coerce.number()`, so the raw field value (string from the input) differs
// from the parsed output — the form's input/output types must be distinguished for the
// resolver and `handleSubmit` to type-check.
type GradeLevelFormInput = z.input<typeof gradeLevelSchema>
type GradeLevelFormOutput = z.output<typeof gradeLevelSchema>

function GradeLevelFormDialog({
  mode,
  gradeLevel,
  nextSequence,
  onClose,
}: {
  mode: 'create' | 'edit'
  gradeLevel?: GradeLevelListItem
  nextSequence: number
  onClose: () => void
}) {
  const createMutation = useCreateGradeLevel()
  const updateMutation = useUpdateGradeLevel()
  const mutation = mode === 'create' ? createMutation : updateMutation

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GradeLevelFormInput, unknown, GradeLevelFormOutput>({
    resolver: zodResolver(gradeLevelSchema),
    defaultValues: {
      name: gradeLevel?.name ?? '',
      sequence: gradeLevel?.sequence ?? nextSequence,
    },
  })

  function onValid(values: GradeLevelFormOutput) {
    if (mode === 'create') {
      createMutation.mutate(values, { onSuccess: onClose })
    } else if (gradeLevel) {
      updateMutation.mutate({ id: gradeLevel.id, ...values }, { onSuccess: onClose })
    }
  }

  return (
    <FormDialog
      title={mode === 'create' ? 'Add Grade Level' : 'Edit Grade Level'}
      description="Grade levels organize sections and subject assignments."
      isSaving={mutation.isPending}
      error={mutation.isError ? "Couldn't save this grade level. Please try again." : null}
      onSubmit={handleSubmit(onValid)}
      onClose={onClose}
      saveLabel={mode === 'create' ? 'Add Grade Level' : 'Save Changes'}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="grade-level-name" className="text-sm font-bold text-foreground">
            Name
          </label>
          <input
            id="grade-level-name"
            type="text"
            placeholder="e.g. Grade 1"
            {...register('name')}
            className={FORM_INPUT_CLASSNAME}
          />
          {errors.name && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="grade-level-sequence" className="text-sm font-bold text-foreground">
            Sequence
          </label>
          <input
            id="grade-level-sequence"
            type="number"
            min={1}
            step={1}
            placeholder="1"
            {...register('sequence')}
            className={FORM_INPUT_CLASSNAME}
          />
          <p className="text-xs font-medium text-muted-foreground">
            Controls display order in lists across the portal.
          </p>
          {errors.sequence && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.sequence.message}</p>
          )}
        </div>
      </div>
    </FormDialog>
  )
}

export default function GradeLevelsPage() {
  const { data: gradeLevels, isLoading, isError } = useGradeLevels()
  const reorderMutation = useReorderGradeLevels()
  const deactivateMutation = useDeactivateGradeLevel()
  const reactivateMutation = useReactivateGradeLevel()

  const [formDialog, setFormDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; gradeLevel: GradeLevelListItem } | null
  >(null)
  const [deactivateTarget, setDeactivateTarget] = useState<GradeLevelListItem | null>(null)

  const sorted = gradeLevels ?? []
  const nextSequence = sorted.length > 0 ? Math.max(...sorted.map((g) => g.sequence)) + 1 : 1

  function closeDeactivateDialog() {
    setDeactivateTarget(null)
    deactivateMutation.reset()
  }

  function moveGradeLevel(index: number, direction: 'up' | 'down') {
    const neighborIndex = direction === 'up' ? index - 1 : index + 1
    const current = sorted[index]
    const neighbor = sorted[neighborIndex]
    if (!current || !neighbor) return
    reorderMutation.mutate({
      firstId: current.id,
      firstSequence: current.sequence,
      secondId: neighbor.id,
      secondSequence: neighbor.sequence,
    })
  }

  return (
    <PortalShell
      title="Grade Levels"
      subtitle="Manage the grade levels offered by the school and their display order."
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setFormDialog({ mode: 'create' })}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add Grade Level
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading grade levels…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive-foreground">
          Couldn&apos;t load grade levels. Try refreshing the page.
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-foreground">
              No grade levels yet
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Add your first grade level to start building sections and subjects.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormDialog({ mode: 'create' })}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Grade Level
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reorderMutation.isError && (
            <InlineMutationError message="Couldn't reorder grade levels. Please try again." />
          )}
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <ScrollableTable>
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {columns.map((h, i) => (
                      <th
                        key={h || i}
                        scope="col"
                        className={cn(
                          'px-5 py-3.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground',
                          i === columns.length - 1 && 'text-right',
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((gradeLevel, index) => (
                    <Fragment key={gradeLevel.id}>
                      <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <GraduationCap className="size-4" aria-hidden />
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {gradeLevel.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {gradeLevel.sequence}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveGradeLevel(index, 'up')}
                                disabled={index === 0 || reorderMutation.isPending}
                                aria-label={`Move ${gradeLevel.name} up`}
                                title="Move up"
                                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                              >
                                <ArrowUp className="size-3.5" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveGradeLevel(index, 'down')}
                                disabled={index === sorted.length - 1 || reorderMutation.isPending}
                                aria-label={`Move ${gradeLevel.name} down`}
                                title="Move down"
                                className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                              >
                                <ArrowDown className="size-3.5" aria-hidden />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {gradeLevel.isActive ? (
                            <Badge tone="success">Active</Badge>
                          ) : (
                            <Badge tone="muted">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setFormDialog({ mode: 'edit', gradeLevel })}
                              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label={`Edit ${gradeLevel.name}`}
                              title="Edit"
                            >
                              <Pencil className="size-4" aria-hidden />
                            </button>
                            {gradeLevel.isActive ? (
                              <button
                                type="button"
                                onClick={() => setDeactivateTarget(gradeLevel)}
                                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                aria-label={`Deactivate ${gradeLevel.name}`}
                                title="Deactivate"
                              >
                                <Power className="size-4" aria-hidden />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => reactivateMutation.mutate(gradeLevel.id)}
                                disabled={reactivateMutation.isPending}
                                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                                aria-label={`Activate ${gradeLevel.name}`}
                                title="Activate"
                              >
                                <RotateCcw className="size-4" aria-hidden />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {reactivateMutation.isError &&
                        reactivateMutation.variables === gradeLevel.id && (
                          <tr className="border-b border-border last:border-0">
                            <td colSpan={columns.length} className="px-5 pb-3.5">
                              <div className="sticky left-0 mt-2 w-fit">
                                <InlineMutationError message="Couldn't reactivate this grade level. Please try again." />
                              </div>
                            </td>
                          </tr>
                        )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          </div>
        </div>
      )}

      {formDialog && (
        <GradeLevelFormDialog
          mode={formDialog.mode}
          gradeLevel={formDialog.mode === 'edit' ? formDialog.gradeLevel : undefined}
          nextSequence={nextSequence}
          onClose={() => setFormDialog(null)}
        />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate Grade Level?"
          description={`${deactivateTarget.name} won't appear in new section or subject assignments. Existing assignments are kept.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          errorMessage={
            deactivateMutation.isError
              ? "Couldn't deactivate this grade level. Please try again."
              : undefined
          }
          onCancel={closeDeactivateDialog}
          onConfirm={() => {
            deactivateMutation.mutate(deactivateTarget.id, { onSuccess: closeDeactivateDialog })
          }}
        />
      )}
    </PortalShell>
  )
}
