import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setCurrentSchoolYear } from '../api/set-current-school-year'

export function useSetCurrentSchoolYear(schoolYearId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setCurrentSchoolYear,
    onSuccess: () => {
      // The list (every row's "Current" badge can change) — invalidated exactly, not the whole
      // prefix, so other years' cached detail queries aren't needlessly marked stale.
      queryClient.invalidateQueries({ queryKey: ['management', 'school-years'], exact: true })
      // This year's own detail (isCurrent flipped to true).
      queryClient.invalidateQueries({ queryKey: ['management', 'school-years', schoolYearId] })
    },
  })
}
