import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setSectionAdviser } from '../api/set-section-adviser'

export function useSetSectionAdviser(sectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setSectionAdviser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'sections'], exact: true })
      queryClient.invalidateQueries({ queryKey: ['management', 'sections', sectionId] })
    },
  })
}
