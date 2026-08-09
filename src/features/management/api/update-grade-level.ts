import { supabase } from '@/lib/supabase'

export interface UpdateGradeLevelInput {
  id: string
  name: string
  sequence: number
}

export async function updateGradeLevel(input: UpdateGradeLevelInput): Promise<void> {
  const { error } = await supabase
    .from('grade_levels')
    .update({ name: input.name, sequence: input.sequence })
    .eq('id', input.id)
  if (error) throw error
}
