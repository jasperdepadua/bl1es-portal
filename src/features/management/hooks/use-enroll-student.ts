import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enrollStudent } from '../api/enroll-student'

export function useEnrollStudent(sectionId: string, schoolYearId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: enrollStudent,
    onSuccess: () => {
      // The sections list (enrolledCount changed) — invalidated exactly, not the whole prefix,
      // so other sections' cached detail/roster queries aren't needlessly marked stale.
      queryClient.invalidateQueries({ queryKey: ['management', 'sections'], exact: true })
      // This section's detail (enrolledCount) + roster — both share this prefix.
      queryClient.invalidateQueries({ queryKey: ['management', 'sections', sectionId] })
      queryClient.invalidateQueries({
        queryKey: ['management', 'enrollable-students', schoolYearId],
      })
    },
  })
}
