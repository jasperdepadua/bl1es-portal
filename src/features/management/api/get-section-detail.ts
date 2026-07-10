import { supabase } from '@/lib/supabase'

export interface SectionDetail {
  id: string
  name: string
  gradeLevelId: string
  gradeLevelName: string
  schoolYearId: string
  schoolYearLabel: string
  shift: 'AM' | 'PM' | null
  adviserId: string | null
  adviserName: string | null
  adviserContactEmail: string | null
  enrolledCount: number
}

export async function getSectionDetail(sectionId: string): Promise<SectionDetail> {
  const { data: section, error: sectionError } = await supabase
    .from('sections')
    .select('id, name, grade_level_id, school_year_id, shift, adviser_id')
    .eq('id', sectionId)
    .single()
  if (sectionError) throw sectionError

  const [
    { data: gradeLevel, error: gradeLevelError },
    { data: schoolYear, error: schoolYearError },
    { data: adviser, error: adviserError },
    { count: enrolledCount, error: enrolledCountError },
  ] = await Promise.all([
    supabase.from('grade_levels').select('name').eq('id', section.grade_level_id).single(),
    supabase.from('school_years').select('label').eq('id', section.school_year_id).single(),
    section.adviser_id
      ? supabase
          .from('profiles')
          .select('first_name, last_name, contact_email')
          .eq('id', section.adviser_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('section_id', sectionId)
      .eq('status', 'enrolled'),
  ])
  if (gradeLevelError) throw gradeLevelError
  if (schoolYearError) throw schoolYearError
  if (adviserError) throw adviserError
  if (enrolledCountError) throw enrolledCountError

  return {
    id: section.id,
    name: section.name,
    gradeLevelId: section.grade_level_id,
    gradeLevelName: gradeLevel?.name ?? 'Unknown grade level',
    schoolYearId: section.school_year_id,
    schoolYearLabel: schoolYear?.label ?? 'Unknown school year',
    shift: section.shift,
    adviserId: section.adviser_id,
    adviserName: adviser ? `${adviser.first_name} ${adviser.last_name}` : null,
    adviserContactEmail: adviser?.contact_email ?? null,
    enrolledCount: enrolledCount ?? 0,
  }
}
