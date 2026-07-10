import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/assign-subject-teacher', () => ({ assignSubjectTeacher: vi.fn() }))

import { assignSubjectTeacher } from '../api/assign-subject-teacher'
import { useAssignSubjectTeacher } from './use-assign-subject-teacher'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useAssignSubjectTeacher', () => {
  beforeEach(() => {
    vi.mocked(assignSubjectTeacher).mockReset()
  })

  it("invalidates this section's subject-teachers list on success", async () => {
    vi.mocked(assignSubjectTeacher).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useAssignSubjectTeacher('section-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ sectionId: 'section-1', subjectId: 'subj-1', teacherId: 'teacher-2' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['management', 'sections', 'section-1', 'subject-teachers'],
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })
})
