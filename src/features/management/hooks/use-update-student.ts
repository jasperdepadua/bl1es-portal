import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStudent } from '../api/update-student'

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'students', 'accounts'] })
    },
  })
}
