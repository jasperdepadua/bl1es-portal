import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Backpack, Pencil, Plus, Power, RotateCcw } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'
import { Badge } from '../components/badge'
import { ConfirmDialog } from '../components/confirm-dialog'
import { FormDialog, FORM_INPUT_CLASSNAME, FORM_FIELD_ERROR_CLASSNAME } from '../components/form-dialog'
import { Initials } from '../components/initials'
import { RegistrationSuccessDialog } from '../components/registration-success-dialog'
import { useStudentAccounts } from '../hooks/use-student-accounts'
import { useRegisterStudent } from '../hooks/use-register-user'
import { useUpdateStudent } from '../hooks/use-update-student'
import { useDeactivateStudent } from '../hooks/use-deactivate-student'
import { useReactivateStudent } from '../hooks/use-reactivate-student'
import type { StudentAccountListItem } from '../api/list-student-accounts'

const columns = ['Name', 'Student Number', 'Guardian', 'Current Section', 'Status', '']

/** `''` → `undefined` for optional guardian fields, matching `RegisterStudentInput`'s optional
 * shape — an untouched optional field should be omitted, not sent as an empty string. */
function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

const studentRegisterSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  guardianName: z.string().trim().optional(),
  guardianRelationship: z.string().trim().optional(),
  guardianContactNumber: z.string().trim().optional(),
  guardianEmail: z
    .string()
    .trim()
    .min(1, 'Guardian email is required')
    .email('Enter a valid email address'),
  is4psBeneficiary: z.boolean(),
})
type StudentRegisterValues = z.infer<typeof studentRegisterSchema>

function GuardianFields({
  idPrefix,
  register,
  errors,
}: {
  idPrefix: string
  register: ReturnType<typeof useForm<StudentRegisterValues>>['register']
  errors: ReturnType<typeof useForm<StudentRegisterValues>>['formState']['errors']
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-guardian-name`} className="text-sm font-bold text-foreground">
            Guardian Name <span className="font-medium text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${idPrefix}-guardian-name`}
            type="text"
            placeholder="e.g. Ana Cruz"
            {...register('guardianName')}
            className={FORM_INPUT_CLASSNAME}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${idPrefix}-guardian-relationship`}
            className="text-sm font-bold text-foreground"
          >
            Relationship <span className="font-medium text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${idPrefix}-guardian-relationship`}
            type="text"
            placeholder="e.g. Mother"
            {...register('guardianRelationship')}
            className={FORM_INPUT_CLASSNAME}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-guardian-contact-number`}
          className="text-sm font-bold text-foreground"
        >
          Guardian Contact Number <span className="font-medium text-muted-foreground">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-guardian-contact-number`}
          type="text"
          placeholder="e.g. 0917 123 4567"
          {...register('guardianContactNumber')}
          className={FORM_INPUT_CLASSNAME}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-guardian-email`} className="text-sm font-bold text-foreground">
          Guardian Email
        </label>
        <input
          id={`${idPrefix}-guardian-email`}
          type="email"
          placeholder="e.g. ana.cruz@example.com"
          {...register('guardianEmail')}
          className={FORM_INPUT_CLASSNAME}
        />
        {errors.guardianEmail && (
          <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.guardianEmail.message}</p>
        )}
      </div>
      <label
        htmlFor={`${idPrefix}-4ps`}
        className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
      >
        <input
          id={`${idPrefix}-4ps`}
          type="checkbox"
          {...register('is4psBeneficiary')}
          className="size-4 rounded border-border accent-primary"
        />
        4Ps Beneficiary
      </label>
    </>
  )
}

function StudentRegisterDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (recipientEmail: string) => void
}) {
  const registerMutation = useRegisterStudent()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentRegisterValues>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      guardianName: '',
      guardianRelationship: '',
      guardianContactNumber: '',
      guardianEmail: '',
      is4psBeneficiary: false,
    },
  })

  function onValid(values: StudentRegisterValues) {
    registerMutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        guardianName: emptyToUndefined(values.guardianName ?? ''),
        guardianRelationship: emptyToUndefined(values.guardianRelationship ?? ''),
        guardianContactNumber: emptyToUndefined(values.guardianContactNumber ?? ''),
        guardianEmail: values.guardianEmail,
        is4psBeneficiary: values.is4psBeneficiary,
      },
      { onSuccess: () => onSuccess(values.guardianEmail) },
    )
  }

  return (
    <FormDialog
      title="Add Student"
      description="Registers the student's identity and emails a setup invite to the guardian. Enrollment happens on the Sections pages."
      isSaving={registerMutation.isPending}
      error={registerMutation.isError ? registerMutation.error.message : null}
      onSubmit={handleSubmit(onValid)}
      onClose={onClose}
      saveLabel="Send Invite"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-first-name" className="text-sm font-bold text-foreground">
              First Name
            </label>
            <input
              id="student-first-name"
              type="text"
              placeholder="e.g. Juan"
              {...register('firstName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.firstName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-last-name" className="text-sm font-bold text-foreground">
              Last Name
            </label>
            <input
              id="student-last-name"
              type="text"
              placeholder="e.g. Dela Cruz"
              {...register('lastName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.lastName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <GuardianFields idPrefix="student" register={register} errors={errors} />
      </div>
    </FormDialog>
  )
}

const studentEditSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  guardianName: z.string().trim().optional(),
  guardianRelationship: z.string().trim().optional(),
  guardianContactNumber: z.string().trim().optional(),
  guardianEmail: z
    .string()
    .trim()
    .min(1, 'Guardian email is required')
    .email('Enter a valid email address'),
  is4psBeneficiary: z.boolean(),
})
type StudentEditValues = z.infer<typeof studentEditSchema>

function StudentEditDialog({
  student,
  onClose,
}: {
  student: StudentAccountListItem
  onClose: () => void
}) {
  const updateMutation = useUpdateStudent()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentEditValues>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      firstName: student.firstName,
      lastName: student.lastName,
      guardianName: student.guardianName ?? '',
      guardianRelationship: student.guardianRelationship ?? '',
      guardianContactNumber: student.guardianContactNumber ?? '',
      guardianEmail: student.guardianEmail ?? '',
      is4psBeneficiary: student.is4psBeneficiary,
    },
  })

  function onValid(values: StudentEditValues) {
    updateMutation.mutate(
      {
        id: student.id,
        firstName: values.firstName,
        lastName: values.lastName,
        guardianName: emptyToUndefined(values.guardianName ?? ''),
        guardianRelationship: emptyToUndefined(values.guardianRelationship ?? ''),
        guardianContactNumber: emptyToUndefined(values.guardianContactNumber ?? ''),
        guardianEmail: values.guardianEmail,
        is4psBeneficiary: values.is4psBeneficiary,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <FormDialog
      title="Edit Student"
      description="Student number and account status aren't editable here."
      isSaving={updateMutation.isPending}
      error={updateMutation.isError ? "Couldn't save this student. Please try again." : null}
      onSubmit={handleSubmit(onValid)}
      onClose={onClose}
      saveLabel="Save Changes"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-edit-first-name" className="text-sm font-bold text-foreground">
              First Name
            </label>
            <input
              id="student-edit-first-name"
              type="text"
              {...register('firstName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.firstName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-edit-last-name" className="text-sm font-bold text-foreground">
              Last Name
            </label>
            <input
              id="student-edit-last-name"
              type="text"
              {...register('lastName')}
              className={FORM_INPUT_CLASSNAME}
            />
            {errors.lastName && (
              <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <GuardianFields idPrefix="student-edit" register={register} errors={errors} />
      </div>
    </FormDialog>
  )
}

export default function StudentsPage() {
  const { data, isLoading, isError } = useStudentAccounts()
  const deactivateMutation = useDeactivateStudent()
  const reactivateMutation = useReactivateStudent()

  const [registerDialog, setRegisterDialog] = useState<
    { step: 'form' } | { step: 'success'; recipientEmail: string } | null
  >(null)
  const [editTarget, setEditTarget] = useState<StudentAccountListItem | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<StudentAccountListItem | null>(null)

  const students = data?.students ?? []
  const hasCurrentSchoolYear = data?.hasCurrentSchoolYear ?? true

  function closeDeactivateDialog() {
    setDeactivateTarget(null)
    deactivateMutation.reset()
  }

  return (
    <PortalShell
      title="Students"
      subtitle="Register student accounts. Enrollment happens on the Sections pages."
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setRegisterDialog({ step: 'form' })}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add Student
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading students…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive">
          Couldn&apos;t load students. Try refreshing the page.
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Backpack className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-foreground">No students yet</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Register your first student to send their guardian a setup invite.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRegisterDialog({ step: 'form' })}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Student
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left">
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
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Initials name={student.name} className="size-9 text-xs" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{student.name}</span>
                          {student.is4psBeneficiary && <Badge tone="secondary">4Ps</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-muted-foreground">
                        {student.studentNumber ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                      {student.guardianName ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {!hasCurrentSchoolYear ? (
                        <span className="text-sm font-medium text-muted-foreground">—</span>
                      ) : student.currentSectionLabel ? (
                        <Badge tone="primary">{student.currentSectionLabel}</Badge>
                      ) : (
                        <Badge tone="muted">Not enrolled</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {student.isActive ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge tone="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(student)}
                          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${student.name}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        {student.isActive ? (
                          <button
                            type="button"
                            onClick={() => setDeactivateTarget(student)}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Deactivate ${student.name}`}
                            title="Deactivate"
                          >
                            <Power className="size-4" aria-hidden />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reactivateMutation.mutate(student.id)}
                            disabled={reactivateMutation.isPending}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                            aria-label={`Activate ${student.name}`}
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

      {registerDialog?.step === 'form' && (
        <StudentRegisterDialog
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
        <StudentEditDialog student={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title="Deactivate Student?"
          description={`${deactivateTarget.name} will no longer be able to log in. Their enrollment history is kept.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          errorMessage={
            deactivateMutation.isError
              ? "Couldn't deactivate this student. Please try again."
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
