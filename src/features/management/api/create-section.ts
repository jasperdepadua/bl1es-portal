import { supabase } from '@/lib/supabase'

export interface CreateSectionInput {
  name: string
  gradeLevelId: string
  schoolYearId: string
  shift?: 'AM' | 'PM' | null
}

export async function createSection(input: CreateSectionInput): Promise<void> {
  const { error } = await supabase.from('sections').insert({
    name: input.name,
    grade_level_id: input.gradeLevelId,
    school_year_id: input.schoolYearId,
    shift: input.shift ?? null,
  })
  if (error) throw error
}
