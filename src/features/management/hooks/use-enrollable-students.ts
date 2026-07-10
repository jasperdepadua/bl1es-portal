import { useQuery } from '@tanstack/react-query'
import { listEnrollableStudents } from '../api/list-enrollable-students'

export function useEnrollableStudents(schoolYearId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['management', 'enrollable-students', schoolYearId],
    queryFn: () => listEnrollableStudents(schoolYearId as string),
    enabled: enabled && !!schoolYearId,
  })
}
