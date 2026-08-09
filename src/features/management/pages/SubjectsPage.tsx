import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BookOpen, Pencil, Plus, Power, RotateCcw } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'
import { Badge } from '../components/badge'
import { ConfirmDialog } from '../components/confirm-dialog'
import { FormDialog, FORM_INPUT_CLASSNAME, FORM_FIELD_ERROR_CLASSNAME } from '../components/form-dialog'
import { useSubjects } from '../hooks/use-subjects'
import { useGradeLevels } from '../hooks/use-grade-levels'
import { useCreateSubject } from '../hooks/use-create-subject'
import { useUpdateSubject } from '../hooks/use-update-subject'
import { useDeactivateSubject } from '../hooks/use-deactivate-subject'
import { useReactivateSubject } from '../hooks/use-reactivate-subject'
import type { SubjectListItem } from '../api/list-subjects'
import type { GradeLevelListItem } from '../api/list-grade-levels'

const columns = ['Name', 'Status', 'Grade Levels', '']

const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
})

type SubjectFormValues = z.infer<typeof subjectSchema>

function SubjectFormDialog({
  mode,
  subject,
  activeGradeLevels,
  onClose,
}: {
  mode: 'create' | 'edit'
  subject?: SubjectListItem
  activeGradeLevels: GradeLevelListItem[]
  onClose: () => void
}) {
  const createMutation = useCreateSubject()
  const updateMutation = useUpdateSubject()
  const mutation = mode === 'create' ? createMutation : updateMutation

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: subject?.name ?? '' },
  })

  const [selectedGradeLevelIds, setSelectedGradeLevelIds] = useState<Set<string>>(
    () => new Set(subject?.gradeLevels.map((g) => g.id) ?? []),
  )

  function toggleGradeLevel(id: string) {
    setSelectedGradeLevelIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function onValid(values: SubjectFormValues) {
    const gradeLevelIds = [...selectedGradeLevelIds]
    if (mode === 'create') {
      createMutation.mutate({ ...values, gradeLevelIds }, { onSuccess: onClose })
    } else if (subject) {
      updateMutation.mutate({ id: subject.id, ...values, gradeLevelIds }, { onSuccess: onClose })
    }
  }

  return (
    <FormDialog
      title={mode === 'create' ? 'Add Subject' : 'Edit Subject'}
      description="Name the subject and choose which grade levels teach it."
      isSaving={mutation.isPending}
      error={mutation.isError ? "Couldn't save this subject. Please try again." : null}
      onSubmit={handleSubmit(onValid)}
      onClose={onClose}
      saveLabel={mode === 'create' ? 'Add Subject' : 'Save Changes'}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="subject-name" className="text-sm font-bold text-foreground">
            Name
          </label>
          <input
            id="subject-name"
            type="text"
            placeholder="e.g. Mathematics"
            {...register('name')}
            className={FORM_INPUT_CLASSNAME}
          />
          {errors.name && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-foreground">Grade Levels</span>
          <p className="text-xs font-medium text-muted-foreground">
            Choose which grade levels teach this subject. Kinder&apos;s curriculum is thematic, so
            it typically has none.
          </p>
          {activeGradeLevels.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-3.5 py-3 text-sm font-medium text-muted-foreground">
              No active grade levels yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1 rounded-2xl border border-border p-2">
              {activeGradeLevels.map((gradeLevel) => (
                <li key={gradeLevel.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={selectedGradeLevelIds.has(gradeLevel.id)}
                      onChange={() => toggleGradeLevel(gradeLevel.id)}
                      className="size-4 rounded border-border accent-primary"
                    />
                    {gradeLevel.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FormDialog>
  )
}

export default function SubjectsPage() {
  const { data: subjects, isLoading, isError } = useSubjects()
  const { data: gradeLevels } = useGradeLevels()
  const deactivateMutation = useDeactivateSubject()
  const reactivateMutation = useReactivateSubject()

  const [formDialog, setFormDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; subject: SubjectListItem } | null
  >(null)
  const [deactivateTarget, setDeactivateTarget] = useState<SubjectListItem | null>(null)

  const activeGradeLevels = (gradeLevels ?? []).filter((g) => g.isActive)

  function closeDeactivateDialog() {
    setDeactivateTarget(null)
    deactivateMutation.reset()
  }

  return (
    <PortalShell
      title="Subjects"
      subtitle="Manage subjects and the grade levels that teach them."
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setFormDialog({ mode: 'create' })}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add Subject
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading subjects…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive">
          Couldn&apos;t load subjects. Try refreshing the page.
        </div>
      ) : !subjects || subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-foreground">No subjects yet</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Add your first subject and assign it to the grade levels that teach it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormDialog({ mode: 'create' })}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Subject
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
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
                {subjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <BookOpen className="size-4" aria-hidden />
                        </span>
                        <span className="text-sm font-bold text-foreground">{subject.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {subject.isActive ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge tone="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {subject.gradeLevels.length === 0 ? (
                        <span className="text-sm font-medium text-muted-foreground">
                          No grade levels assigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {subject.gradeLevels.map((gradeLevel) => (
                            <Badge key={gradeLevel.id} tone="muted">
                              {gradeLevel.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setFormDialog({ mode: 'edit', subject })}
                          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${subject.name}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        {subject.isActive ? (
                          <button
                            type="button"
                            onClick={() => setDeactivateTarget(subject)}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Deactivate ${subject.name}`}
                            title="Deactivate"
                          >
                            <Power className="size-4" aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reactivateMutation.mutate(subject.id)}
                            disabled={reactivateMutation.isPending}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                            aria-label={`Activate ${subject.name}`}
                            title="Activate"
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

      {formDialog && (
        <SubjectFormDialog
          mode={formDialog.mode}
          subject={formDialog.mode === 'edit' ? formDialog.subject : undefined}
          activeGradeLevels={activeGradeLevels}
          onClose={() => setFormDialog(null)}
        />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate Subject?"
          description={`${deactivateTarget.name} will no longer be available for new grade-level or teacher assignments. Its existing grade-level assignments are kept.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          errorMessage={
            deactivateMutation.isError
              ? "Couldn't deactivate this subject. Please try again."
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
