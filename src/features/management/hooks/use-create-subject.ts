import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSubject } from '../api/create-subject'

export function useCreateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'subjects'] })
    },
  })
}
