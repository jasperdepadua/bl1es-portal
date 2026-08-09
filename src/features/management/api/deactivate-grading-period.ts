import { supabase } from '@/lib/supabase'

export async function deactivateGradingPeriod(gradingPeriodId: string): Promise<void> {
  const { error } = await supabase
    .from('grading_periods')
    .update({ is_active: false })
    .eq('id', gradingPeriodId)
  if (error) throw error
}
