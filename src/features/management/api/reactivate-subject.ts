import { supabase } from '@/lib/supabase'

/** Restores a subject's active status. Its `grade_level_subjects` assignments were left
 * untouched on deactivation, so this restores the exact prior state. */
export async function reactivateSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').update({ is_active: true }).eq('id', id)
  if (error) throw error
}
