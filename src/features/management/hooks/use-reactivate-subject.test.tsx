import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/reactivate-subject', () => ({ reactivateSubject: vi.fn() }))

import { reactivateSubject } from '../api/reactivate-subject'
import { useReactivateSubject } from './use-reactivate-subject'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useReactivateSubject', () => {
  beforeEach(() => {
    vi.mocked(reactivateSubject).mockReset()
  })

  it('invalidates the subjects list on success', async () => {
    vi.mocked(reactivateSubject).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('subj-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'subjects'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(reactivateSubject).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('subj-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
