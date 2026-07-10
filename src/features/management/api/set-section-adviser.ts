import { supabase } from '@/lib/supabase'

export interface SetSectionAdviserInput {
  sectionId: string
  adviserId: string
}

export async function setSectionAdviser(input: SetSectionAdviserInput): Promise<void> {
  const { error } = await supabase
    .from('sections')
    .update({ adviser_id: input.adviserId })
    .eq('id', input.sectionId)
  if (error) throw error
}
