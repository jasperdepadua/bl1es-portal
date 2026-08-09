import { supabase } from '@/lib/supabase'

/** Restores a teacher's active status and login/app access. */
export async function reactivateTeacher(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active: true }).eq('id', id)
  if (error) throw error
}
