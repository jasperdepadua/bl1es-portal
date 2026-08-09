import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reactivateGradeLevel } from '../api/reactivate-grade-level'

export function useReactivateGradeLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateGradeLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'grade-levels'] })
    },
  })
}
