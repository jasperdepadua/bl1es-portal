import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/reactivate-grading-period', () => ({ reactivateGradingPeriod: vi.fn() }))

import { reactivateGradingPeriod } from '../api/reactivate-grading-period'
import { useReactivateGradingPeriod } from './use-reactivate-grading-period'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useReactivateGradingPeriod', () => {
  beforeEach(() => {
    vi.mocked(reactivateGradingPeriod).mockReset()
  })

  it('invalidates the school year detail on success', async () => {
    vi.mocked(reactivateGradingPeriod).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateGradingPeriod('sy-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('gp-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['management', 'school-years', 'sy-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(reactivateGradingPeriod).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateGradingPeriod('sy-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('gp-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
