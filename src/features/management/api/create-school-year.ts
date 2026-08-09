import { supabase } from '@/lib/supabase'

export interface CreateSchoolYearInput {
  label: string
  startDate: string
  endDate: string
}

// A newly created year is never automatically current — "current" is a deliberate, separate
// action (see set-current-school-year.ts) taken from the year's detail page.
export async function createSchoolYear(input: CreateSchoolYearInput): Promise<void> {
  const { error } = await supabase.from('school_years').insert({
    label: input.label,
    start_date: input.startDate,
    end_date: input.endDate,
  })
  if (error) throw error
}
