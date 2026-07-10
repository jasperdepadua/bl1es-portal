import { supabase } from '@/lib/supabase'

export interface TeacherOption {
  id: string
  name: string
  contactEmail: string | null
}

/** Active teacher accounts (role = 'admin') — the pool for adviser and subject-teacher pickers. */
export async function listTeachers(): Promise<TeacherOption[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, contact_email')
    .eq('role', 'admin')
    .eq('is_active', true)
    .order('first_name')
  if (error) throw error

  return (data ?? []).map((p) => ({
    id: p.id,
    name: `${p.first_name} ${p.last_name}`,
    contactEmail: p.contact_email,
  }))
}
