import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGradingPeriod } from '../api/update-grading-period'

export function useUpdateGradingPeriod(schoolYearId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateGradingPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'school-years', schoolYearId] })
    },
  })
}
