import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerTeacher, registerStudent } from '../api/register-user'

export function useRegisterTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registerTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'teachers'] })
    },
  })
}

export function useRegisterStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registerStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'students'] })
    },
  })
}
