import { useNavigate } from 'react-router-dom'
import { ChevronRight, Layers, Users } from 'lucide-react'
import { PortalShell } from '@/layouts/portal-shell'
import { cn } from '@/lib/utils'
import { useSections } from '../hooks/use-sections'
import { Badge } from '../components/badge'

const columns = ['Name', 'Grade Level', 'School Year', 'Adviser', 'Enrolled', '']

export default function SectionsListPage() {
  const navigate = useNavigate()
  const { data: sections, isLoading, isError } = useSections()

  return (
    <PortalShell
      title="Sections"
      subtitle="All class sections across grade levels and school years."
    >
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
              Sections are created for a grade level and school year — set those up first.
            </p>
          </div>
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
                      if (e.key === 'Enter' || e.key === ' ') {
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
    </PortalShell>
  )
}
