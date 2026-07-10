import { supabase } from '@/lib/supabase'

export interface SubjectTeacherRow {
  subjectId: string
  subjectName: string
  assignmentId: string | null
  teacherId: string | null
  teacherName: string | null
}

export interface GetSectionSubjectTeachersInput {
  sectionId: string
  gradeLevelId: string
}

/**
 * For every (active) subject this grade level offers, the currently active teacher
 * assignment for this section, if any. Empty array means the grade level has no discrete
 * subjects (e.g. Kinder) — the caller renders the "no subjects" empty state for that case.
 */
export async function getSectionSubjectTeachers(
  input: GetSectionSubjectTeachersInput,
): Promise<SubjectTeacherRow[]> {
  const { data: gradeLevelSubjects, error: gradeLevelSubjectsError } = await supabase
    .from('grade_level_subjects')
    .select('subject_id')
    .eq('grade_level_id', input.gradeLevelId)
  if (gradeLevelSubjectsError) throw gradeLevelSubjectsError
  if (!gradeLevelSubjects || gradeLevelSubjects.length === 0) return []

  const subjectIds = gradeLevelSubjects.map((row) => row.subject_id)

  const [
    { data: subjects, error: subjectsError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase
      .from('subjects')
      .select('id, name')
      .in('id', subjectIds)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('subject_assignments')
      .select('id, subject_id, teacher_id')
      .eq('section_id', input.sectionId)
      .eq('is_active', true)
      .in('subject_id', subjectIds),
  ])
  if (subjectsError) throw subjectsError
  if (assignmentsError) throw assignmentsError

  const teacherIds = [...new Set((assignments ?? []).map((a) => a.teacher_id))]
  const { data: teachers, error: teachersError } =
    teacherIds.length > 0
      ? await supabase.from('profiles').select('id, first_name, last_name').in('id', teacherIds)
      : { data: [], error: null }
  if (teachersError) throw teachersError

  const assignmentBySubjectId = new Map((assignments ?? []).map((a) => [a.subject_id, a]))
  const teacherById = new Map((teachers ?? []).map((t) => [t.id, t]))

  return (subjects ?? []).map((subject) => {
    const assignment = assignmentBySubjectId.get(subject.id)
    const teacher = assignment ? teacherById.get(assignment.teacher_id) : undefined
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      assignmentId: assignment?.id ?? null,
      teacherId: assignment?.teacher_id ?? null,
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : null,
    }
  })
}
