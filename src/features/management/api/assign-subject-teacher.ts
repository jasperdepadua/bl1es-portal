import { supabase } from '@/lib/supabase'

export interface AssignSubjectTeacherInput {
  sectionId: string
  subjectId: string
  teacherId: string
}

/**
 * Assigns a teacher to a subject for a section. `subject_assignments` has no constraint
 * preventing two active teachers for the same subject+section, so any existing active
 * assignment is deactivated first — there is only ever one active teacher per subject
 * per section.
 */
export async function assignSubjectTeacher(input: AssignSubjectTeacherInput): Promise<void> {
  const { error: deactivateError } = await supabase
    .from('subject_assignments')
    .update({ is_active: false })
    .eq('section_id', input.sectionId)
    .eq('subject_id', input.subjectId)
    .eq('is_active', true)
  if (deactivateError) throw deactivateError

  const { error: insertError } = await supabase.from('subject_assignments').insert({
    section_id: input.sectionId,
    subject_id: input.subjectId,
    teacher_id: input.teacherId,
  })
  if (insertError) throw insertError
}
