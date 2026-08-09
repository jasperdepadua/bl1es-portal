import { supabase } from '@/lib/supabase'

export interface CreateGradingPeriodInput {
  schoolYearId: string
  label: string
  sequence: number
  startDate: string | null
  endDate: string | null
}

export async function createGradingPeriod(input: CreateGradingPeriodInput): Promise<void> {
  const { error } = await supabase.from('grading_periods').insert({
    school_year_id: input.schoolYearId,
    label: input.label,
    sequence: input.sequence,
    start_date: input.startDate,
    end_date: input.endDate,
  })
  if (error) throw error
}
