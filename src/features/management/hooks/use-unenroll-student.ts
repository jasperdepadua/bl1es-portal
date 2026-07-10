import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unenrollStudent } from '../api/unenroll-student'

export function useUnenrollStudent(sectionId: string, schoolYearId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unenrollStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management', 'sections'], exact: true })
      queryClient.invalidateQueries({ queryKey: ['management', 'sections', sectionId] })
      queryClient.invalidateQueries({
        queryKey: ['management', 'enrollable-students', schoolYearId],
      })
    },
  })
}
