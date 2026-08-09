import { supabase } from '@/lib/supabase'

export async function setInvitePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}
