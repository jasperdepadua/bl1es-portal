import { supabase } from '@/lib/supabase'

/**
 * Soft-deactivates a student account. This also revokes their login/app access (see the
 * `is_active`-aware RLS policies on `profiles`/`student_details`) — never touches
 * `sections`/`enrollments`, so historical enrollment records are preserved untouched.
 */
export async function deactivateStudent(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id)
  if (error) throw error
}
