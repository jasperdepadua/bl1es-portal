import { supabase } from '@/lib/supabase'

export async function unenrollStudent(enrollmentId: string): Promise<void> {
  const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId)
  if (error) throw error
}
