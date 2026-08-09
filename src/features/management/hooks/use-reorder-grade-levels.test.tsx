import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/reorder-grade-levels', () => ({ reorderGradeLevels: vi.fn() }))

import { reorderGradeLevels } from '../api/reorder-grade-levels'
import { useReorderGradeLevels } from './use-reorder-grade-levels'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useReorderGradeLevels', () => {
  beforeEach(() => {
    vi.mocked(reorderGradeLevels).mockReset()
  })

  it('invalidates the grade levels list on success', async () => {
    vi.mocked(reorderGradeLevels).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReorderGradeLevels(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      firstId: 'gl-1',
      firstSequence: 2,
      secondId: 'gl-2',
      secondSequence: 1,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'grade-levels'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(reorderGradeLevels).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReorderGradeLevels(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      firstId: 'gl-1',
      firstSequence: 2,
      secondId: 'gl-2',
      secondSequence: 1,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
