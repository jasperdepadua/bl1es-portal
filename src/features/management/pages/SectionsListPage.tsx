import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, Layers, Plus, Users } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'
import { useSections } from '../hooks/use-sections'
import { useGradeLevels } from '../hooks/use-grade-levels'
import { useSchoolYears } from '../hooks/use-school-years'
import { useCreateSection } from '../hooks/use-create-section'
import { Badge } from '../components/badge'
import {
  FormDialog,
  FormSelect,
  FORM_INPUT_CLASSNAME,
  FORM_FIELD_ERROR_CLASSNAME,
} from '../components/form-dialog'

const columns = ['Name', 'Grade Level', 'School Year', 'Adviser', 'Enrolled', '']

const sectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  gradeLevelId: z.string().min(1, 'Grade level is required'),
  schoolYearId: z.string().min(1, 'School year is required'),
  shift: z.union([z.literal('AM'), z.literal('PM'), z.literal('')]),
})

type SectionFormValues = z.infer<typeof sectionSchema>

function CreateSectionDialog({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateSection()
  const { data: gradeLevels } = useGradeLevels()
  const { data: schoolYears } = useSchoolYears()
  const activeGradeLevels = (gradeLevels ?? []).filter((g) => g.isActive)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: '', gradeLevelId: '', schoolYearId: '', shift: '' },
  })

  function onSubmit(values: SectionFormValues) {
    createMutation.mutate(
      {
        name: values.name,
        gradeLevelId: values.gradeLevelId,
        schoolYearId: values.schoolYearId,
        shift: values.shift === '' ? null : values.shift,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <FormDialog
      title="Add Section"
      description="A section belongs to one grade level and one school year."
      isSaving={createMutation.isPending}
      error={createMutation.isError ? "Couldn't create this section. Please try again." : null}
      onSubmit={handleSubmit(onSubmit)}
      onClose={onClose}
      saveLabel="Add Section"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="section-name" className="text-sm font-bold text-foreground">
            Name
          </label>
          <input
            id="section-name"
            type="text"
            placeholder="e.g. Mabini"
            {...register('name')}
            className={FORM_INPUT_CLASSNAME}
          />
          {errors.name && <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="section-grade-level" className="text-sm font-bold text-foreground">
            Grade Level
          </label>
          <FormSelect id="section-grade-level" {...register('gradeLevelId')} defaultValue="">
            <option value="" disabled>
              Select a grade level
            </option>
            {activeGradeLevels.map((gradeLevel) => (
              <option key={gradeLevel.id} value={gradeLevel.id}>
                {gradeLevel.name}
              </option>
            ))}
          </FormSelect>
          {errors.gradeLevelId && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.gradeLevelId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="section-school-year" className="text-sm font-bold text-foreground">
            School Year
          </label>
          <FormSelect id="section-school-year" {...register('schoolYearId')} defaultValue="">
            <option value="" disabled>
              Select a school year
            </option>
            {(schoolYears ?? []).map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
              </option>
            ))}
          </FormSelect>
          {errors.schoolYearId && (
            <p className={FORM_FIELD_ERROR_CLASSNAME}>{errors.schoolYearId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="section-shift" className="text-sm font-bold text-foreground">
            Shift <span className="font-medium text-muted-foreground">(optional)</span>
          </label>
          <FormSelect id="section-shift" {...register('shift')} defaultValue="">
            <option value="">No shift</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </FormSelect>
        </div>
      </div>
    </FormDialog>
  )
}

export default function SectionsListPage() {
  const navigate = useNavigate()
  const { data: sections, isLoading, isError } = useSections()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <PortalShell
      title="Sections"
      subtitle="All sections across grade levels and school years."
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" aria-hidden />
          Add Section
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-muted-foreground">
          Loading sections…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center text-sm font-medium text-destructive">
          Couldn&apos;t load sections. Try refreshing the page.
        </div>
      ) : !sections || sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-foreground">
              No sections yet
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Sections are created for a grade level and school year — set those up first if you
              haven't already.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden />
            Add Section
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
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
                {sections.map((section) => (
                  <tr
                    key={section.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`View ${section.name}`}
                    onClick={() => navigate(`/management/sections/${section.id}`)}
                    onKeyDown={(e) => {
                      // role="link" activates on Enter only — unlike role="button", Space is
                      // reserved for page-scroll, matching native <a> semantics.
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        navigate(`/management/sections/${section.id}`)
                      }
                    }}
                    className="cursor-pointer border-b border-border outline-none transition-colors last:border-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Layers className="size-4" aria-hidden />
                        </span>
                        <span className="text-sm font-bold text-foreground">{section.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone="primary">{section.gradeLevelName}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone="secondary">{section.schoolYearLabel}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                      {section.adviserName ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Users className="size-4 text-muted-foreground" aria-hidden />
                        {section.enrolledCount}
                      </div>
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

      {createDialogOpen && <CreateSectionDialog onClose={() => setCreateDialogOpen(false)} />}
    </PortalShell>
  )
}
