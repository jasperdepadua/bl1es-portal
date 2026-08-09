import { supabase } from '@/lib/supabase'

export async function reactivateGradeLevel(id: string): Promise<void> {
  const { error } = await supabase.from('grade_levels').update({ is_active: true }).eq('id', id)
  if (error) throw error
}
