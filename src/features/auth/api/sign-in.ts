import { supabase } from '@/lib/supabase'
import { resolveLoginEmail, type LoginRole } from './resolve-login-email'

export async function signIn(identifier: string, password: string, role: LoginRole): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: resolveLoginEmail(identifier, role),
    password,
  })
  if (error) throw new Error('Incorrect login or password')
}
