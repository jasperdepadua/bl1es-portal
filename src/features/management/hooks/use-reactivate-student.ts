import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reactivateStudent } from '../api/reactivate-student'

export function useReactivateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'students', 'accounts'] })
    },
  })
}
