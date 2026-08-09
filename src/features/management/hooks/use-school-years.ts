import { useQuery } from '@tanstack/react-query'
import { listSchoolYears } from '../api/list-school-years'

export function useSchoolYears() {
  return useQuery({
    queryKey: ['management', 'school-years'],
    queryFn: listSchoolYears,
  })
}
