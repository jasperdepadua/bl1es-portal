import { supabase } from '@/lib/supabase'

export interface GradeLevelListItem {
  id: string
  name: string
  sequence: number
  isActive: boolean
}

export async function listGradeLevels(): Promise<GradeLevelListItem[]> {
  const { data, error } = await supabase
    .from('grade_levels')
    .select('id, name, sequence, is_active')
    .order('sequence', { ascending: true })
  if (error) throw error

  return (data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    sequence: g.sequence,
    isActive: g.is_active,
  }))
}
