import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reactivateTeacher } from '../api/reactivate-teacher'

export function useReactivateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reactivateTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'teachers', 'accounts'] })
    },
  })
}
