import { supabase } from '@/lib/supabase'

export interface RosterEntry {
  enrollmentId: string
  studentId: string
  studentName: string
  studentNumber: string
  guardianName: string | null
  isActive: boolean
}

export async function getSectionRoster(sectionId: string): Promise<RosterEntry[]> {
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('id, student_id')
    .eq('section_id', sectionId)
    .eq('status', 'enrolled')
  if (enrollmentsError) throw enrollmentsError
  if (!enrollments || enrollments.length === 0) return []

  const studentIds = enrollments.map((e) => e.student_id)

  const [
    { data: profiles, error: profilesError },
    { data: details, error: detailsError },
  ] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, is_active').in('id', studentIds),
    supabase
      .from('student_details')
      .select('profile_id, student_number, guardian_name')
      .in('profile_id', studentIds),
  ])
  if (profilesError) throw profilesError
  if (detailsError) throw detailsError

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const detailByProfileId = new Map((details ?? []).map((d) => [d.profile_id, d]))

  return enrollments
    .map((e) => {
      const profile = profileById.get(e.student_id)
      const detail = detailByProfileId.get(e.student_id)
      return {
        enrollmentId: e.id,
        studentId: e.student_id,
        studentName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown student',
        studentNumber: detail?.student_number ?? '—',
        guardianName: detail?.guardian_name ?? null,
        isActive: profile?.is_active ?? true,
      }
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName))
}
