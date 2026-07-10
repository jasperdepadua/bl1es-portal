import { useQuery } from '@tanstack/react-query'
import { getSectionSubjectTeachers } from '../api/get-section-subject-teachers'

export function useSectionSubjectTeachers(sectionId: string | undefined, gradeLevelId: string | undefined) {
  return useQuery({
    queryKey: ['management', 'sections', sectionId, 'subject-teachers'],
    queryFn: () =>
      getSectionSubjectTeachers({ sectionId: sectionId as string, gradeLevelId: gradeLevelId as string }),
    enabled: !!sectionId && !!gradeLevelId,
  })
}
