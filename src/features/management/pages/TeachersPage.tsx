import { Fragment, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Pencil, Plus, Power, RotateCcw, Users } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { InlineMutationError } from '@/components/inline-mutation-error'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/badge'
import { ConfirmDialog } from '../components/confirm-dialog'
import { FormDialog, FORM_INPUT_CLASSNAME, FORM_FIELD_ERROR_CLASSNAME } from '../components/form-dialog'
import { Initials } from '../components/initials'
import { RegistrationSuccessDialog } from '../components/registration-success-dialog'
import { ScrollableTable } from '../components/scrollable-table'
import { useTeacherAccounts } from '../hooks/use-teacher-accounts'
import { useRegisterTeacher } from '../hooks/use-register-user'
import { useUpdateTeacher } from '../hooks/use-update-teacher'
import { useDeactivateTeacher } from '../hooks/use-deactivate-teacher'
import { useReactivateTeacher } from '../hooks/use-reactivate-teacher'
import type { TeacherAccountListItem } from '../api/list-teacher-accounts'

const columns = ['Name', 'Contact Email', 'Username', 'Adviser Of', 'Subjects Taught', 'Status', '']

/** Lowercases and strips anything outside `[a-z0-9]` from one name part — the building block
 * for the `firstname.lastname` username suggestion below. */
function sanitizeUsernamePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const teacherRegisterSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  username: z.string().trim().min(1, 'Username is required'),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Contact email is required')
    .email('Enter a valid email address'),
})
type TeacherRegisterValues = z.infer<typeof teacherRegisterSchema>

function TeacherRegisterDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (recipientEmail: string) => void
}) {
  const registerMutation = useRegisterTeacher()
  const [usernameTouched, setUsernameTouched] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TeacherRegisterValues>({
    resolver: zodResolver(teacherRegisterSchema),
    defaultValues: { firstName: '', lastName: '', username: '', contactEmail: '' },
  })

  const firstName = watch('firstName')
  const lastName = watch('lastName')

  // Auto-suggest `firstname.lastname` from the name fields while the superadmin hasn't
  // hand-edited the username themselves — no live collision check, no server-side renumbering;
  // a 409 from the Edge Function on an actual collision surfaces below and they edit + resubmit.
  useEffect(() => {
    if (usernameTouched) return
    setValue('username', `${sanitizeUsernamePart(firstName)}.${sanitizeUsernamePart(lastName)}`)
  }, [firstName, lastName, usernameTouched, setValue])

  function onValid(values: TeacherRegisterValues) {
    registerMutation.mutate(values, { onSuccess: () => onSuccess(values.contactEmail) })
  }

  return (
    <FormDialog
      title="Add Teacher"
      description="Registers the teacher's identity and emails them an invite to set up their account. Section and subject assignments happen on the Sections pages."
      isSaving={registerMutation.isPending}
      error={registerMutation.isError ? registerMutation.error.message : null}
      onSubmit={handleSubmit(onValid)}
      onClose={onClose}
      saveLabel="Send Invite"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="teacher-first-name" className="text-sm font-bold text-foreground">
              First Name
            </label>
            <input
              id="teacher-first-name"
              type="text"
              placeholder="e.g. Maria"
              {...register('firstName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.firstName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="teacher-last-name" className="text-sm font-bold text-foreground">
              Last Name
            </label>
            <input
              id="teacher-last-name"
              type="text"
              placeholder="e.g. Santos"
              {...register('lastName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.lastName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="teacher-username" className="text-sm font-bold text-foreground">
            Username
          </label>
          <input
            id="teacher-username"
            type="text"
            placeholder="e.g. maria.santos"
            {...register('username', { onChange: () => setUsernameTouched(true) })}
            className={FORM_INPUT_CLASSNAME}
          />
          <p className="text-xs font-medium text-muted-foreground">
            Suggested from the name above — edit it if it&apos;s already taken.
          </p>
          {errors.username && <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.username.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="teacher-contact-email" className="text-sm font-bold text-foreground">
            Contact Email
          </label>
          <input
            id="teacher-contact-email"
            type="email"
            placeholder="e.g. maria.santos@example.com"
            {...register('contactEmail')}
            className={FORM_INPUT_CLASSNAME}
          />
          <p className="text-xs font-medium text-muted-foreground">
            The account-setup invite is sent here.
          </p>
          {errors.contactEmail && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.contactEmail.message}</p>
          )}
        </div>
      </div>
    </FormDialog>
  )
}

const teacherEditSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Contact email is required')
    .email('Enter a valid email address'),
})
type TeacherEditValues = z.infer<typeof teacherEditSchema>

function TeacherEditDialog({
  teacher,
  onClose,
}: {
  teacher: TeacherAccountListItem
  onClose: () => void
}) {
  const updateMutation = useUpdateTeacher()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherEditValues>({
    resolver: zodResolver(teacherEditSchema),
    defaultValues: {
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      contactEmail: teacher.contactEmail ?? '',
    },
  })

  function onValid(values: TeacherEditValues) {
    updateMutation.mutate({ id: teacher.id, ...values }, { onSuccess: onClose })
  }

  return (
    <FormDialog
      title="Edit Teacher"
      description="Username and account status aren't editable here."
      isSaving={updateMutation.isPending}
      error={updateMutation.isError ? "Couldn't save this teacher. Please try again." : null}
      onSubmit={handleSubmit(onValid)}
      onClose={onClose}
      saveLabel="Save Changes"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="teacher-edit-first-name" className="text-sm font-bold text-foreground">
              First Name
            </label>
            <input
              id="teacher-edit-first-name"
              type="text"
              {...register('firstName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.firstName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="teacher-edit-last-name" className="text-sm font-bold text-foreground">
              Last Name
            </label>
            <input
              id="teacher-edit-last-name"
              type="text"
              {...register('lastName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.lastName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="teacher-edit-contact-email" className="text-sm font-bold text-foreground">
            Contact Email
          </label>
          <input
            id="teacher-edit-contact-email"
            type="email"
            {...register('contactEmail')}
            className={FORM_INPUT_CLASSNAME}
          />
          {errors.contactEmail && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.contactEmail.message}</p>
          )}
        </div>
      </div>
    </FormDialog>
  )
}

export default function TeachersPage() {
  const { data: teachers, isLoading, isError } = useTeacherAccounts()
  const deactivateMutation = useDeactivateTeacher()
  const reactivateMutation = useReactivateTeacher()

  const [registerDialog, setRegisterDialog] = useState<
    { step: 'form' } | { step: 'success'; recipientEmail: string } | null
  >(null)
  const [editTarget, setEditTarget] = useState<TeacherAccountListItem | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<TeacherAccountListItem | null>(null)

  function closeDeactivateDialog() {
    setDeactivateTarget(null)
    deactivateMutation.reset()
  }

  return (
    <PortalShell
      title="Teachers"
      subtitle="Register teacher accounts. Section and subject assignments happen on the Sections pages."
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setRegisterDialog({ step: 'form' })}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add Teacher
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading teachers…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive-foreground">
          Couldn&apos;t load teachers. Try refreshing the page.
        </div>
      ) : !teachers || teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-foreground">No teachers yet</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Register your first teacher to send them an account-setup invite.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRegisterDialog({ step: 'form' })}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Teacher
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <ScrollableTable>
            <table className="w-full min-w-[960px] border-collapse text-left">
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
                {teachers.map((teacher) => (
                  <Fragment key={teacher.id}>
                  <tr
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Initials name={teacher.name} className="size-9 text-xs" />
                        <span className="text-sm font-bold text-foreground">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                      {teacher.contactEmail ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-muted-foreground">
                        {teacher.username ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {teacher.adviserOf.length === 0 ? (
                        <span className="text-sm font-medium text-muted-foreground">
                          Unassigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {teacher.adviserOf.map((chip) => (
                            <Badge key={chip.sectionId} tone="muted">
                              {chip.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {teacher.subjectsTaught.length === 0 ? (
                        <span className="text-sm font-medium text-muted-foreground">
                          Unassigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {teacher.subjectsTaught.map((chip) => (
                            <Badge key={`${chip.subjectId}-${chip.sectionId}`} tone="muted">
                              {chip.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {teacher.isActive ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge tone="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(teacher)}
                          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${teacher.name}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        {teacher.isActive ? (
                          <button
                            type="button"
                            onClick={() => setDeactivateTarget(teacher)}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Deactivate ${teacher.name}`}
                            title="Deactivate"
                          >
                            <Power className="size-4" aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reactivateMutation.mutate(teacher.id)}
                            disabled={reactivateMutation.isPending}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                            aria-label={`Activate ${teacher.name}`}
                            title="Activate"
                          >
                            <RotateCcw className="size-4" aria-hidden />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {reactivateMutation.isError && reactivateMutation.variables === teacher.id && (
                    <tr className="border-b border-border last:border-0">
                      <td colSpan={columns.length} className="px-5 pb-3.5">
                        <div className="sticky left-0 mt-2 w-fit">
                          <InlineMutationError message="Couldn't reactivate this teacher. Please try again." />
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
      )}

      {registerDialog?.step === 'form' && (
        <TeacherRegisterDialog
          onClose={() => setRegisterDialog(null)}
          onSuccess={(recipientEmail) => setRegisterDialog({ step: 'success', recipientEmail })}
        />
      )}

      {registerDialog?.step === 'success' && (
        <RegistrationSuccessDialog
          recipientEmail={registerDialog.recipientEmail}
          onDone={() => setRegisterDialog(null)}
        />
      )}

      {editTarget && (
        <TeacherEditDialog teacher={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate Teacher?"
          description={`${deactivateTarget.name} will no longer be able to log in, and won't be available for new adviser or subject-teacher assignments. Existing assignments and history are kept.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          errorMessage={
            deactivateMutation.isError
              ? "Couldn't deactivate this teacher. Please try again."
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
