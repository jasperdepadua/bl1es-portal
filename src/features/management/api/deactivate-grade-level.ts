import { supabase } from '@/lib/supabase'

export async function deactivateGradeLevel(id: string): Promise<void> {
  const { error } = await supabase.from('grade_levels').update({ is_active: false }).eq('id', id)
  if (error) throw error
}
