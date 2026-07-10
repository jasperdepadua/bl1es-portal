import { useQuery } from '@tanstack/react-query'
import { listTeachers } from '../api/list-teachers'

export function useTeachers(enabled: boolean) {
  return useQuery({
    queryKey: ['management', 'teachers'],
    queryFn: listTeachers,
    enabled,
  })
}
