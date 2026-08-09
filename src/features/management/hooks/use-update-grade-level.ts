import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGradeLevel } from '../api/update-grade-level'

export function useUpdateGradeLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateGradeLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'grade-levels'] })
    },
  })
}
