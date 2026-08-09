import { supabase } from '@/lib/supabase'

/**
 * Soft-deactivates a teacher account. This also revokes their login/app access (see the
 * `is_active`-aware RLS policies on `profiles`/`student_details`) — never touches
 * `sections`/`enrollments`/`subject_assignments`, so historical adviser/subject-teacher
 * assignments are preserved untouched.
 */
export async function deactivateTeacher(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id)
  if (error) throw error
}
