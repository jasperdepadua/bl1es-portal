import { useQuery } from '@tanstack/react-query'
import { listSubjects } from '../api/list-subjects'

export function useSubjects() {
  return useQuery({
    queryKey: ['management', 'subjects'],
    queryFn: listSubjects,
  })
}
