import { supabase } from '@/lib/supabase'

export interface CreateGradeLevelInput {
  name: string
  sequence: number
}

export async function createGradeLevel(input: CreateGradeLevelInput): Promise<void> {
  const { error } = await supabase
    .from('grade_levels')
    .insert({ name: input.name, sequence: input.sequence })
  if (error) throw error
}
