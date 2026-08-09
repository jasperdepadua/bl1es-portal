import { supabase } from '@/lib/supabase'

export interface UpdateSubjectInput {
  id: string
  name: string
  gradeLevelIds: string[]
}

/**
 * Updates the subject's name, then reconciles `grade_level_subjects` by diffing the
 * requested grade-level-id set against the subject's current assignments — deleting
 * removed pairs and inserting added ones. Not wrapped in a single transaction (matches
 * this app's existing granularity elsewhere, e.g. enroll/unenroll); a partial failure is
 * recoverable by re-editing.
 */
export async function updateSubject(input: UpdateSubjectInput): Promise<void> {
  const { error: updateError } = await supabase
    .from('subjects')
    .update({ name: input.name })
    .eq('id', input.id)
  if (updateError) throw updateError

  const { data: current, error: currentError } = await supabase
    .from('grade_level_subjects')
    .select('grade_level_id')
    .eq('subject_id', input.id)
  if (currentError) throw currentError

  const currentIds = new Set((current ?? []).map((row) => row.grade_level_id))
  const nextIds = new Set(input.gradeLevelIds)

  const toRemove = [...currentIds].filter((id) => !nextIds.has(id))
  const toAdd = [...nextIds].filter((id) => !currentIds.has(id))

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('grade_level_subjects')
      .delete()
      .eq('subject_id', input.id)
      .in('grade_level_id', toRemove)
    if (deleteError) throw deleteError
  }

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase.from('grade_level_subjects').insert(
      toAdd.map((gradeLevelId) => ({ subject_id: input.id, grade_level_id: gradeLevelId })),
    )
    if (insertError) throw insertError
  }
}
