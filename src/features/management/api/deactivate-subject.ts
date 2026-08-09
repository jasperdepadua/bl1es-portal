import { supabase } from '@/lib/supabase'

/**
 * Soft-deletes a subject. Leaves `grade_level_subjects` rows untouched so reactivating
 * the subject restores its exact prior grade-level assignments.
 */
export async function deactivateSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').update({ is_active: false }).eq('id', id)
  if (error) throw error
}
