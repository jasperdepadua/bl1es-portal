import { supabase } from '@/lib/supabase'

export interface EnrollStudentInput {
  sectionId: string
  schoolYearId: string
  studentId: string
}

export async function enrollStudent(input: EnrollStudentInput): Promise<void> {
  const { error } = await supabase.from('enrollments').insert({
    student_id: input.studentId,
    section_id: input.sectionId,
    school_year_id: input.schoolYearId,
  })
  if (error) throw error
}
