import { supabase } from '@/lib/supabase'

export interface SchoolYearListItem {
  id: string
  label: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export async function listSchoolYears(): Promise<SchoolYearListItem[]> {
  const { data, error } = await supabase
    .from('school_years')
    .select('id, label, start_date, end_date, is_current')
    .order('start_date', { ascending: false })
  if (error) throw error

  return (data ?? []).map((year) => ({
    id: year.id,
    label: year.label,
    startDate: year.start_date,
    endDate: year.end_date,
    isCurrent: year.is_current,
  }))
}
