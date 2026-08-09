import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deactivateGradingPeriod } from '../api/deactivate-grading-period'

export function useDeactivateGradingPeriod(schoolYearId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateGradingPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'school-years', schoolYearId] })
    },
  })
}
