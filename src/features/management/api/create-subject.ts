import { supabase } from '@/lib/supabase'

export interface CreateSubjectInput {
  name: string
  gradeLevelIds: string[]
}

export async function createSubject(input: CreateSubjectInput): Promise<void> {
  const { data, error } = await supabase
    .from('subjects')
    .insert({ name: input.name })
    .select('id')
    .single()
  if (error) throw error

  if (input.gradeLevelIds.length > 0) {
    const { error: assignError } = await supabase.from('grade_level_subjects').insert(
      input.gradeLevelIds.map((gradeLevelId) => ({
        subject_id: data.id,
        grade_level_id: gradeLevelId,
      })),
    )
    if (assignError) throw assignError
  }
}
