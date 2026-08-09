import { supabase } from '@/lib/supabase'

export interface TeacherAdviserChip {
  sectionId: string
  label: string
}

export interface TeacherSubjectChip {
  subjectId: string
  sectionId: string
  label: string
}

export interface TeacherAccountListItem {
  id: string
  firstName: string
  lastName: string
  name: string
  contactEmail: string | null
  username: string | null
  isActive: boolean
  /** One chip per section this teacher advises, e.g. "Kinder–Masaya". */
  adviserOf: TeacherAdviserChip[]
  /** One chip per (subject, section) assignment row — not deduped by subject name, since the
   * same teacher can teach the same subject in two different sections, e.g. "MAPEH · Grade 4–Rizal". */
  subjectsTaught: TeacherSubjectChip[]
}

/**
 * Full Teachers list (all statuses) — distinct from `list-teachers.ts`'s narrow active-only
 * picker query. Composition mirrors `list-enrollable-students.ts`: parallel queries, then
 * assembled by id in JS via `Map`s, rather than a nested Supabase embed.
 */
export async function listTeacherAccounts(): Promise<TeacherAccountListItem[]> {
  const { data: teacherRows, error: teachersError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, contact_email, username, is_active')
    .eq('role', 'admin')
    .order('first_name')
  if (teachersError) throw teachersError

  const teachers = teacherRows ?? []
  if (teachers.length === 0) return []

  // Fetch every section (not just advised ones) in one query — small dataset for a single
  // elementary school — so adviser-of and subjects-taught chips can both resolve grade-level
  // names from the same in-memory map without a second, narrower "advised only" query.
  const [
    { data: sectionRows, error: sectionsError },
    { data: assignmentRows, error: assignmentsError },
  ] = await Promise.all([
    supabase.from('sections').select('id, name, grade_level_id, adviser_id'),
    supabase
      .from('subject_assignments')
      .select('section_id, subject_id, teacher_id')
      .eq('is_active', true),
  ])
  if (sectionsError) throw sectionsError
  if (assignmentsError) throw assignmentsError

  const sections = sectionRows ?? []
  const assignments = assignmentRows ?? []

  const gradeLevelIds = [...new Set(sections.map((s) => s.grade_level_id))]
  const subjectIds = [...new Set(assignments.map((a) => a.subject_id))]

  const [
    { data: gradeLevelRows, error: gradeLevelsError },
    { data: subjectRows, error: subjectsError },
  ] = await Promise.all([
    gradeLevelIds.length > 0
      ? supabase.from('grade_levels').select('id, name').in('id', gradeLevelIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    subjectIds.length > 0
      ? supabase.from('subjects').select('id, name').in('id', subjectIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
  ])
  if (gradeLevelsError) throw gradeLevelsError
  if (subjectsError) throw subjectsError

  const gradeLevelNameById = new Map((gradeLevelRows ?? []).map((g) => [g.id, g.name]))
  const sectionById = new Map(sections.map((s) => [s.id, s]))
  const subjectNameById = new Map((subjectRows ?? []).map((s) => [s.id, s.name]))

  function sectionLabel(sectionId: string): string {
    const section = sectionById.get(sectionId)
    if (!section) return 'Unknown section'
    const gradeLevelName = gradeLevelNameById.get(section.grade_level_id) ?? 'Unknown grade level'
    return `${gradeLevelName}–${section.name}`
  }

  const adviserOfByTeacherId = new Map<string, TeacherAdviserChip[]>()
  for (const section of sections) {
    if (!section.adviser_id) continue
    const chips = adviserOfByTeacherId.get(section.adviser_id) ?? []
    chips.push({ sectionId: section.id, label: sectionLabel(section.id) })
    adviserOfByTeacherId.set(section.adviser_id, chips)
  }

  const subjectsTaughtByTeacherId = new Map<string, TeacherSubjectChip[]>()
  for (const assignment of assignments) {
    const chips = subjectsTaughtByTeacherId.get(assignment.teacher_id) ?? []
    const subjectName = subjectNameById.get(assignment.subject_id) ?? 'Unknown subject'
    chips.push({
      subjectId: assignment.subject_id,
      sectionId: assignment.section_id,
      label: `${subjectName} · ${sectionLabel(assignment.section_id)}`,
    })
    subjectsTaughtByTeacherId.set(assignment.teacher_id, chips)
  }

  return teachers.map((t) => ({
    id: t.id,
    firstName: t.first_name,
    lastName: t.last_name,
    name: `${t.first_name} ${t.last_name}`,
    contactEmail: t.contact_email,
    username: t.username,
    isActive: t.is_active,
    adviserOf: adviserOfByTeacherId.get(t.id) ?? [],
    subjectsTaught: subjectsTaughtByTeacherId.get(t.id) ?? [],
  }))
}
