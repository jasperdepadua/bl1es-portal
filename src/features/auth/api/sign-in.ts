import { supabase } from '@/lib/supabase'
import { resolveLoginEmail } from './resolve-login-email'

export async function signIn(identifier: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: resolveLoginEmail(identifier),
    password,
  })
  if (error) throw new Error('Incorrect login or password')
}
