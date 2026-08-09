import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deactivateTeacher } from '../api/deactivate-teacher'

export function useDeactivateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'teachers', 'accounts'] })
    },
  })
}
