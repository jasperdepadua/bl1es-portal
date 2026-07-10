import { useQuery } from '@tanstack/react-query'
import { getSectionRoster } from '../api/get-section-roster'

export function useSectionRoster(sectionId: string | undefined) {
  return useQuery({
    queryKey: ['management', 'sections', sectionId, 'roster'],
    queryFn: () => getSectionRoster(sectionId as string),
    enabled: !!sectionId,
  })
}
