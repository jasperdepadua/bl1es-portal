import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reorderGradeLevels } from '../api/reorder-grade-levels'

export function useReorderGradeLevels() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reorderGradeLevels,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'grade-levels'] })
    },
  })
}
