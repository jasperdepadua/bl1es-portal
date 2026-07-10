import { useQuery } from '@tanstack/react-query'
import { listSections } from '../api/list-sections'

export function useSections() {
  return useQuery({
    queryKey: ['management', 'sections'],
    queryFn: listSections,
  })
}
