import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/update-grade-level', () => ({ updateGradeLevel: vi.fn() }))

import { updateGradeLevel } from '../api/update-grade-level'
import { useUpdateGradeLevel } from './use-update-grade-level'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUpdateGradeLevel', () => {
  beforeEach(() => {
    vi.mocked(updateGradeLevel).mockReset()
  })

  it('invalidates the grade levels list on success', async () => {
    vi.mocked(updateGradeLevel).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateGradeLevel(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'gl-1', name: 'Grade 1', sequence: 2 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'grade-levels'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(updateGradeLevel).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateGradeLevel(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'gl-1', name: 'Grade 1', sequence: 2 })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
