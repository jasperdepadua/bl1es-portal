import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reactivateGradingPeriod } from '../api/reactivate-grading-period'

export function useReactivateGradingPeriod(schoolYearId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateGradingPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'school-years', schoolYearId] })
    },
  })
}
