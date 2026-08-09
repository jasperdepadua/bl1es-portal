import { supabase } from '@/lib/supabase'

export interface UpdateStudentInput {
  id: string
  firstName: string
  lastName: string
  guardianName?: string
  guardianRelationship?: string
  guardianContactNumber?: string
  guardianEmail: string
  is4psBeneficiary: boolean
}

/**
 * Two updates — `profiles` name fields, then `student_details` guardian fields + 4Ps flag —
 * same non-transactional granularity as `update-subject.ts`. `student_number`/`role` are not
 * editable post-creation per spec.
 */
export async function updateStudent(input: UpdateStudentInput): Promise<void> {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ first_name: input.firstName, last_name: input.lastName })
    .eq('id', input.id)
  if (profileError) throw profileError

  const { error: detailsError } = await supabase
    .from('student_details')
    .update({
      guardian_name: input.guardianName ?? null,
      guardian_relationship: input.guardianRelationship ?? null,
      guardian_contact_number: input.guardianContactNumber ?? null,
      guardian_email: input.guardianEmail,
      is_4ps_beneficiary: input.is4psBeneficiary,
    })
    .eq('profile_id', input.id)
  if (detailsError) throw detailsError
}
