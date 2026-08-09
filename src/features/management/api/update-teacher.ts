import { supabase } from '@/lib/supabase'

export interface UpdateTeacherInput {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
}

/** Edits identity fields only — `username`/`role` are not editable post-creation per spec. */
export async function updateTeacher(input: UpdateTeacherInput): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      contact_email: input.contactEmail,
    })
    .eq('id', input.id)
  if (error) throw error
}
