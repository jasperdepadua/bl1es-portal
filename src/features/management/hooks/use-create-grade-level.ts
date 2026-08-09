import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGradeLevel } from '../api/create-grade-level'

export function useCreateGradeLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGradeLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'grade-levels'] })
    },
  })
}
