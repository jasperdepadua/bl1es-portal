import { supabase } from '@/lib/supabase'

export interface SubjectGradeLevel {
  id: string
  name: string
}

export interface SubjectListItem {
  id: string
  name: string
  isActive: boolean
  gradeLevels: SubjectGradeLevel[]
}

export async function listSubjects(): Promise<SubjectListItem[]> {
  const [
    { data: subjects, error: subjectsError },
    { data: gradeLevels, error: gradeLevelsError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase.from('subjects').select('id, name, is_active').order('name'),
    supabase.from('grade_levels').select('id, name').order('sequence'),
    supabase.from('grade_level_subjects').select('subject_id, grade_level_id'),
  ])
  if (subjectsError) throw subjectsError
  if (gradeLevelsError) throw gradeLevelsError
  if (assignmentsError) throw assignmentsError

  const gradeLevelIdsBySubject = new Map<string, Set<string>>()
  for (const a of assignments ?? []) {
    const ids = gradeLevelIdsBySubject.get(a.subject_id) ?? new Set<string>()
    ids.add(a.grade_level_id)
    gradeLevelIdsBySubject.set(a.subject_id, ids)
  }

  return (subjects ?? []).map((s) => {
    const assignedIds = gradeLevelIdsBySubject.get(s.id)
    return {
      id: s.id,
      name: s.name,
      isActive: s.is_active,
      // Preserve grade_levels' sequence order (Kinder → Grade 6) rather than join order.
      gradeLevels: assignedIds
        ? (gradeLevels ?? [])
            .filter((g) => assignedIds.has(g.id))
            .map((g) => ({ id: g.id, name: g.name }))
        : [],
    }
  })
}
