import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarRange, ChevronRight, Plus } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'
import { useSchoolYears } from '../hooks/use-school-years'
import { useCreateSchoolYear } from '../hooks/use-create-school-year'
import { Badge } from '../components/badge'
import { FormDialog, FORM_INPUT_CLASSNAME, FORM_FIELD_ERROR_CLASSNAME } from '../components/form-dialog'

const columns = ['Label', 'Start Date', 'End Date', 'Status', '']

const schoolYearFormSchema = z
  .object({
    label: z.string().trim().min(1, 'Label is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

type SchoolYearFormValues = z.infer<typeof schoolYearFormSchema>

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function CreateSchoolYearDialog({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateSchoolYear()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolYearFormValues>({
    resolver: zodResolver(schoolYearFormSchema),
    defaultValues: { label: '', startDate: '', endDate: '' },
  })

  function onSubmit(values: SchoolYearFormValues) {
    createMutation.mutate(values, { onSuccess: onClose })
  }

  return (
    <FormDialog
      title="Add School Year"
      description="A school year groups grading periods, sections, and enrollments."
      isSaving={createMutation.isPending}
      error={
        createMutation.isError ? "Couldn't create this school year. Please try again." : null
      }
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      saveLabel="Add School Year"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="label" className="text-sm font-bold text-foreground">
            Label
          </label>
          <input
            id="label"
            type="text"
            placeholder="2026-2027"
            className={FORM_INPUT_CLASSNAME}
            {...register('label')}
          />
          {errors.label && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.label.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-bold text-foreground">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            className={FORM_INPUT_CLASSNAME}
            {...register('startDate')}
          />
          {errors.startDate && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.startDate.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="endDate" className="text-sm font-bold text-foreground">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            className={FORM_INPUT_CLASSNAME}
            {...register('endDate')}
          />
          {errors.endDate && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.endDate.message}</p>
          )}
        </div>
      </div>
    </FormDialog>
  )
}

export default function SchoolYearsListPage() {
  const navigate = useNavigate()
  const { data: schoolYears, isLoading, isError } = useSchoolYears()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <PortalShell
      title="School Years"
      subtitle="Set up school years and manage their grading periods."
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add School Year
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading school years…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive">
          Couldn&apos;t load school years. Try refreshing the page.
        </div>
      ) : !schoolYears || schoolYears.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarRange className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-foreground">
              No school years yet
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Add a school year to start setting up grading periods and sections.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add School Year
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
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
                {schoolYears.map((year) => (
                  <tr
                    key={year.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`View ${year.label}`}
                    onClick={() => navigate(`/management/school-years/${year.id}`)}
                    onKeyDown={(e) => {
                      // role="link" activates on Enter only — unlike role="button", Space is
                      // reserved for page-scroll, matching native <a> semantics.
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        navigate(`/management/school-years/${year.id}`)
                      }
                    }}
                    className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <CalendarRange className="size-4" aria-hidden />
                        </span>
                        <span className="text-sm font-bold text-foreground">{year.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                      {formatDate(year.startDate)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                      {formatDate(year.endDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      {year.isCurrent && <Badge tone="success">Current</Badge>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createDialogOpen && (
        <CreateSchoolYearDialog onClose={() => setCreateDialogOpen(false)} />
      )}
    </PortalShell>
  )
}
