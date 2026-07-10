import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/enroll-student', () => ({ enrollStudent: vi.fn() }))

import { enrollStudent } from '../api/enroll-student'
import { useEnrollStudent } from './use-enroll-student'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useEnrollStudent', () => {
  beforeEach(() => {
    vi.mocked(enrollStudent).mockReset()
  })

  it('invalidates the sections list, this section, and the enrollable-students pool for this year on success', async () => {
    vi.mocked(enrollStudent).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useEnrollStudent('section-1', 'sy-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ sectionId: 'section-1', schoolYearId: 'sy-1', studentId: 'stu-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'sections'], exact: true })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'sections', 'section-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['management', 'enrollable-students', 'sy-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(enrollStudent).mockRejectedValue(new Error('duplicate enrollment'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useEnrollStudent('section-1', 'sy-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ sectionId: 'section-1', schoolYearId: 'sy-1', studentId: 'stu-1' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
