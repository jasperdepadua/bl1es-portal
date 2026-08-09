import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deactivateStudent } from '../api/deactivate-student'

export function useDeactivateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'students', 'accounts'] })
    },
  })
}
