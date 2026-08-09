import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGradingPeriod } from '../api/create-grading-period'

export function useCreateGradingPeriod(schoolYearId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGradingPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'school-years', schoolYearId] })
    },
  })
}
