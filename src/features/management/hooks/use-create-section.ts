import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSection } from '../api/create-section'

export function useCreateSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'sections'] })
    },
  })
}
