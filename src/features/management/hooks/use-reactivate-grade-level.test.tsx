import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/reactivate-grade-level', () => ({ reactivateGradeLevel: vi.fn() }))

import { reactivateGradeLevel } from '../api/reactivate-grade-level'
import { useReactivateGradeLevel } from './use-reactivate-grade-level'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useReactivateGradeLevel', () => {
  beforeEach(() => {
    vi.mocked(reactivateGradeLevel).mockReset()
  })

  it('invalidates the grade levels list on success', async () => {
    vi.mocked(reactivateGradeLevel).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateGradeLevel(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('gl-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'grade-levels'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(reactivateGradeLevel).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateGradeLevel(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('gl-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
