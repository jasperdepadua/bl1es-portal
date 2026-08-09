import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSubject } from '../api/update-subject'

export function useUpdateSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'subjects'] })
    },
  })
}
