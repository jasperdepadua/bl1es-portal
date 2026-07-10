import { supabase } from '@/lib/supabase'

export interface EnrollableStudent {
  id: string
  name: string
  studentNumber: string | null
}

/**
 * Registered, active students (role = 'normal') not yet enrolled anywhere for the given
 * school year — the anti-join enforces "one enrollment per student per school year".
 */
export async function listEnrollableStudents(schoolYearId: string): Promise<EnrollableStudent[]> {
  const [
    { data: enrolledThisYear, error: enrolledError },
    { data: students, error: studentsError },
  ] = await Promise.all([
    supabase.from('enrollments').select('student_id').eq('school_year_id', schoolYearId),
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'normal')
      .eq('is_active', true),
  ])
  if (enrolledError) throw enrolledError
  if (studentsError) throw studentsError

  const enrolledIds = new Set((enrolledThisYear ?? []).map((e) => e.student_id))
  const eligible = (students ?? []).filter((s) => !enrolledIds.has(s.id))
  if (eligible.length === 0) return []

  const { data: details, error: detailsError } = await supabase
    .from('student_details')
    .select('profile_id, student_number')
    .in(
      'profile_id',
      eligible.map((s) => s.id),
    )
  if (detailsError) throw detailsError

  const studentNumberByProfileId = new Map((details ?? []).map((d) => [d.profile_id, d.student_number]))

  return eligible
    .map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      studentNumber: studentNumberByProfileId.get(s.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
