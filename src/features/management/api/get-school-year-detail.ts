import { supabase } from '@/lib/supabase'

export interface GradingPeriod {
  id: string
  label: string
  sequence: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
}

export interface SchoolYearDetail {
  id: string
  label: string
  startDate: string
  endDate: string
  isCurrent: boolean
  gradingPeriods: GradingPeriod[]
}

export async function getSchoolYearDetail(schoolYearId: string): Promise<SchoolYearDetail> {
  const [
    { data: schoolYear, error: schoolYearError },
    { data: gradingPeriodsData, error: gradingPeriodsError },
  ] = await Promise.all([
    supabase
      .from('school_years')
      .select('id, label, start_date, end_date, is_current')
      .eq('id', schoolYearId)
      .single(),
    supabase
      .from('grading_periods')
      .select('id, label, sequence, start_date, end_date, is_active')
      .eq('school_year_id', schoolYearId)
      .order('sequence', { ascending: true }),
  ])
  if (schoolYearError) throw schoolYearError
  if (gradingPeriodsError) throw gradingPeriodsError

  const gradingPeriods = gradingPeriodsData ?? []

  return {
    id: schoolYear.id,
    label: schoolYear.label,
    startDate: schoolYear.start_date,
    endDate: schoolYear.end_date,
    isCurrent: schoolYear.is_current,
    gradingPeriods: gradingPeriods.map((period) => ({
      id: period.id,
      label: period.label,
      sequence: period.sequence,
      startDate: period.start_date,
      endDate: period.end_date,
      isActive: period.is_active,
    })),
  }
}
