import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  role: 'superadmin' | 'admin' | 'normal'
  firstName: string
  lastName: string
  username: string | null
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, first_name, last_name, username')
    .eq('id', user.id)
    .single()
  if (error) throw error

  return {
    id: data.id,
    role: data.role,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
  }
}
