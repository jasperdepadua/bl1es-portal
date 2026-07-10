import { supabase } from '@/lib/supabase'

export interface SectionListItem {
  id: string
  name: string
  gradeLevelName: string
  schoolYearLabel: string
  adviserName: string | null
  enrolledCount: number
}

export async function listSections(): Promise<SectionListItem[]> {
  const [
    { data: sections, error: sectionsError },
    { data: gradeLevels, error: gradeLevelsError },
    { data: schoolYears, error: schoolYearsError },
    { data: enrollments, error: enrollmentsError },
  ] = await Promise.all([
    supabase
      .from('sections')
      .select('id, name, grade_level_id, school_year_id, adviser_id')
      .order('name'),
    supabase.from('grade_levels').select('id, name'),
    supabase.from('school_years').select('id, label'),
    supabase.from('enrollments').select('section_id').eq('status', 'enrolled'),
  ])
  if (sectionsError) throw sectionsError
  if (gradeLevelsError) throw gradeLevelsError
  if (schoolYearsError) throw schoolYearsError
  if (enrollmentsError) throw enrollmentsError

  const adviserIds = [
    ...new Set((sections ?? []).map((s) => s.adviser_id).filter((id): id is string => !!id)),
  ]
  const { data: advisers, error: advisersError } =
    adviserIds.length > 0
      ? await supabase.from('profiles').select('id, first_name, last_name').in('id', adviserIds)
      : { data: [], error: null }
  if (advisersError) throw advisersError

  const gradeLevelNameById = new Map((gradeLevels ?? []).map((g) => [g.id, g.name]))
  const schoolYearLabelById = new Map((schoolYears ?? []).map((y) => [y.id, y.label]))
  const adviserNameById = new Map(
    (advisers ?? []).map((a) => [a.id, `${a.first_name} ${a.last_name}`]),
  )
  const enrolledCountBySection = new Map<string, number>()
  for (const e of enrollments ?? []) {
    enrolledCountBySection.set(e.section_id, (enrolledCountBySection.get(e.section_id) ?? 0) + 1)
  }

  return (sections ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    gradeLevelName: gradeLevelNameById.get(s.grade_level_id) ?? 'Unknown grade level',
    schoolYearLabel: schoolYearLabelById.get(s.school_year_id) ?? 'Unknown school year',
    adviserName: s.adviser_id ? (adviserNameById.get(s.adviser_id) ?? null) : null,
    enrolledCount: enrolledCountBySection.get(s.id) ?? 0,
  }))
}
