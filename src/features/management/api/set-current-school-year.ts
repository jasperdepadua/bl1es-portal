import { supabase } from '@/lib/supabase'

// Atomically unsets the previous current year and sets the new one in a single transaction.
// Never do this as two separate client-side `.update()` calls — that's exactly the race
// condition (and the "zero current years" failure mode) this RPC exists to prevent.
export async function setCurrentSchoolYear(yearId: string): Promise<void> {
  const { error } = await supabase.rpc('set_current_school_year', { p_year_id: yearId })
  if (error) throw error
}
