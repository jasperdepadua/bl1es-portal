import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/unenroll-student', () => ({ unenrollStudent: vi.fn() }))

import { unenrollStudent } from '../api/unenroll-student'
import { useUnenrollStudent } from './use-unenroll-student'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUnenrollStudent', () => {
  beforeEach(() => {
    vi.mocked(unenrollStudent).mockReset()
  })

  it('invalidates the sections list, this section, and the enrollable-students pool for this year on success', async () => {
    vi.mocked(unenrollStudent).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUnenrollStudent('section-1', 'sy-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('enr-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'sections'], exact: true })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'sections', 'section-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['management', 'enrollable-students', 'sy-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
  })
})
