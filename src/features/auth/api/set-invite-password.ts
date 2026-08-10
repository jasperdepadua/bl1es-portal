import { supabase } from '@/lib/supabase'

export async function setInvitePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    throw new Error(
      "Couldn't set your password. Please try again, or request a new invite if this link has expired.",
    )
  }
}
