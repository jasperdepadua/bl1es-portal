import { supabase } from '@/lib/supabase'

export interface StudentAccountListItem {
  id: string
  firstName: string
  lastName: string
  name: string
  studentNumber: string | null
  guardianName: string | null
  guardianRelationship: string | null
  guardianContactNumber: string | null
  guardianEmail: string | null
  is4psBeneficiary: boolean
  isActive: boolean
  /** "Kinder–Masaya"-style label for this student's enrollment in the *current* school year,
   * or null — see `hasCurrentSchoolYear` below for which of two reasons that is. */
  currentSectionLabel: string | null
}

export interface StudentAccountsResult {
  /** Distinguishes "no current school year exists yet" (system-wide setup gap — every
   * student's `currentSectionLabel` is null for this reason) from "a current year exists but
   * this particular student isn't enrolled in it" (the student's own gap). The page renders
   * "—" for the former and a "Not enrolled" badge for the latter. */
  hasCurrentSchoolYear: boolean
  students: StudentAccountListItem[]
}

/**
 * Full Students list (all statuses) — distinct from `list-enrollable-students.ts`'s narrow
 * not-yet-enrolled-this-year picker query. Composition mirrors `list-enrollable-students.ts`:
 * parallel queries, then assembled by id in JS via `Map`s.
 */
export async function listStudentAccounts(): Promise<StudentAccountsResult> {
  const [
    { data: studentRows, error: studentsError },
    { data: currentYearRows, error: currentYearError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, is_active')
      .eq('role', 'normal')
      .order('first_name'),
    supabase.from('school_years').select('id').eq('is_current', true),
  ])
  if (studentsError) throw studentsError
  if (currentYearError) throw currentYearError

  const students = studentRows ?? []
  const hasCurrentSchoolYear = (currentYearRows ?? []).length > 0

  if (students.length === 0) {
    return { hasCurrentSchoolYear, students: [] }
  }

  const studentIds = students.map((s) => s.id)

  const { data: detailRows, error: detailsError } = await supabase
    .from('student_details')
    .select(
      'profile_id, student_number, guardian_name, guardian_relationship, guardian_contact_number, guardian_email, is_4ps_beneficiary',
    )
    .in('profile_id', studentIds)
  if (detailsError) throw detailsError

  const detailByProfileId = new Map((detailRows ?? []).map((d) => [d.profile_id, d]))

  const currentSchoolYearId = currentYearRows?.[0]?.id ?? null
  const sectionLabelByStudentId = new Map<string, string>()

  if (currentSchoolYearId) {
    const { data: enrollmentRows, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('student_id, section_id')
      .eq('school_year_id', currentSchoolYearId)
      .eq('status', 'enrolled')
      .in('student_id', studentIds)
    if (enrollmentsError) throw enrollmentsError

    const enrollments = enrollmentRows ?? []
    const sectionIds = [...new Set(enrollments.map((e) => e.section_id))]

    if (sectionIds.length > 0) {
      const { data: sectionRows, error: sectionsError } = await supabase
        .from('sections')
        .select('id, name, grade_level_id')
        .in('id', sectionIds)
      if (sectionsError) throw sectionsError

      const gradeLevelIds = [...new Set((sectionRows ?? []).map((s) => s.grade_level_id))]
      const { data: gradeLevelRows, error: gradeLevelsError } =
        gradeLevelIds.length > 0
          ? await supabase.from('grade_levels').select('id, name').in('id', gradeLevelIds)
          : { data: [] as { id: string; name: string }[], error: null }
      if (gradeLevelsError) throw gradeLevelsError

      const gradeLevelNameById = new Map((gradeLevelRows ?? []).map((g) => [g.id, g.name]))
      const sectionById = new Map((sectionRows ?? []).map((s) => [s.id, s]))

      for (const enrollment of enrollments) {
        const section = sectionById.get(enrollment.section_id)
        if (!section) continue
        const gradeLevelName = gradeLevelNameById.get(section.grade_level_id) ?? 'Unknown grade level'
        sectionLabelByStudentId.set(enrollment.student_id, `${gradeLevelName}–${section.name}`)
      }
    }
  }

  return {
    hasCurrentSchoolYear,
    students: students.map((s) => {
      const detail = detailByProfileId.get(s.id)
      return {
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        name: `${s.first_name} ${s.last_name}`,
        studentNumber: detail?.student_number ?? null,
        guardianName: detail?.guardian_name ?? null,
        guardianRelationship: detail?.guardian_relationship ?? null,
        guardianContactNumber: detail?.guardian_contact_number ?? null,
        guardianEmail: detail?.guardian_email ?? null,
        is4psBeneficiary: detail?.is_4ps_beneficiary ?? false,
        isActive: s.is_active,
        currentSectionLabel: sectionLabelByStudentId.get(s.id) ?? null,
      }
    }),
  }
}
