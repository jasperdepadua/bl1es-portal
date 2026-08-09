import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSchoolYear } from '../api/create-school-year'

export function useCreateSchoolYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSchoolYear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'school-years'], exact: true })
    },
  })
}
