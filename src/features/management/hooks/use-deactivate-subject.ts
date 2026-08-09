import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deactivateSubject } from '../api/deactivate-subject'

export function useDeactivateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'subjects'] })
    },
  })
}
