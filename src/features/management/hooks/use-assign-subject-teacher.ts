import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignSubjectTeacher } from '../api/assign-subject-teacher'

export function useAssignSubjectTeacher(sectionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignSubjectTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['management', 'sections', sectionId, 'subject-teachers'],
      })
    },
  })
}
