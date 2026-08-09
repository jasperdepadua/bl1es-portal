import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deactivateGradeLevel } from '../api/deactivate-grade-level'

export function useDeactivateGradeLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateGradeLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'grade-levels'] })
    },
  })
}
