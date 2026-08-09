import { useQuery } from '@tanstack/react-query'
import { getSchoolYearDetail } from '../api/get-school-year-detail'

export function useSchoolYearDetail(schoolYearId: string | undefined) {
  return useQuery({
    queryKey: ['management', 'school-years', schoolYearId],
    queryFn: () => getSchoolYearDetail(schoolYearId as string),
    enabled: !!schoolYearId,
  })
}
