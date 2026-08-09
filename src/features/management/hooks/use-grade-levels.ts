import { useQuery } from '@tanstack/react-query'
import { listGradeLevels } from '../api/list-grade-levels'

export function useGradeLevels() {
  return useQuery({
    queryKey: ['management', 'grade-levels'],
    queryFn: listGradeLevels,
  })
}
