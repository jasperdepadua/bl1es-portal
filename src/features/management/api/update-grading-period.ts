import { supabase } from '@/lib/supabase'

export interface UpdateGradingPeriodInput {
  id: string
  label: string
  sequence: number
  startDate: string | null
  endDate: string | null
}

export async function updateGradingPeriod(input: UpdateGradingPeriodInput): Promise<void> {
  const { error } = await supabase
    .from('grading_periods')
    .update({
      label: input.label,
      sequence: input.sequence,
      start_date: input.startDate,
      end_date: input.endDate,
    })
    .eq('id', input.id)
  if (error) throw error
}
