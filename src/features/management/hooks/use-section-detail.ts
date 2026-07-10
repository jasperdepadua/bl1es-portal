import { useQuery } from '@tanstack/react-query'
import { getSectionDetail } from '../api/get-section-detail'

export function useSectionDetail(sectionId: string | undefined) {
  return useQuery({
    queryKey: ['management', 'sections', sectionId],
    queryFn: () => getSectionDetail(sectionId as string),
    enabled: !!sectionId,
  })
}
