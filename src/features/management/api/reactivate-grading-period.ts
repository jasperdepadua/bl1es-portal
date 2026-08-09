import { supabase } from '@/lib/supabase'

export async function reactivateGradingPeriod(gradingPeriodId: string): Promise<void> {
  const { error } = await supabase
    .from('grading_periods')
    .update({ is_active: true })
    .eq('id', gradingPeriodId)
  if (error) throw error
}
