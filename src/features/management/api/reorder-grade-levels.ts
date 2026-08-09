import { supabase } from '@/lib/supabase'

export interface ReorderGradeLevelsInput {
  firstId: string
  firstSequence: number
  secondId: string
  secondSequence: number
}

/**
 * Swaps the `sequence` value between two grade levels (a clicked row and its immediate
 * neighbor by current sort order). No uniqueness constraint on `sequence`, so two independent
 * updates are safe without a transaction.
 */
export async function reorderGradeLevels(input: ReorderGradeLevelsInput): Promise<void> {
  const { error: firstError } = await supabase
    .from('grade_levels')
    .update({ sequence: input.secondSequence })
    .eq('id', input.firstId)
  if (firstError) throw firstError

  const { error: secondError } = await supabase
    .from('grade_levels')
    .update({ sequence: input.firstSequence })
    .eq('id', input.secondId)
  if (secondError) throw secondError
}
