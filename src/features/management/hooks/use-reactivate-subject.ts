import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reactivateSubject } from '../api/reactivate-subject'

export function useReactivateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'subjects'] })
    },
  })
}
