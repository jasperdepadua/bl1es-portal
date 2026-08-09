import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// supabase.functions.invoke() throws a generic FunctionsHttpError on any non-2xx response —
// its .message is always "Edge Function returned a non-2xx status code". The Edge Function's
// actual { error: '...' } body (400/403/409/502 messages) only lives on error.context, a raw
// Response, so it must be parsed out explicitly or every specific message is lost.
async function resolveInvokeError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    return new Error(typeof body?.error === 'string' ? body.error : error.message)
  }
  return error instanceof Error ? error : new Error('Registration failed')
}

export interface RegisterTeacherInput {
  firstName: string
  lastName: string
  username: string
  contactEmail: string
}

export interface RegisterStudentInput {
  firstName: string
  lastName: string
  guardianName?: string
  guardianRelationship?: string
  guardianContactNumber?: string
  guardianEmail: string
  is4psBeneficiary: boolean
}

export async function registerTeacher(input: RegisterTeacherInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('register-user', {
    body: { kind: 'teacher', ...input },
  })
  if (error) throw await resolveInvokeError(error)
  if (!data?.ok) throw new Error('Registration failed')
}

export async function registerStudent(input: RegisterStudentInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('register-user', {
    body: { kind: 'student', ...input },
  })
  if (error) throw await resolveInvokeError(error)
  if (!data?.ok) throw new Error('Registration failed')
}
