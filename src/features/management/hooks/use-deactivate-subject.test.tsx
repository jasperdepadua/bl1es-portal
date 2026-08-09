import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/deactivate-subject', () => ({ deactivateSubject: vi.fn() }))

import { deactivateSubject } from '../api/deactivate-subject'
import { useDeactivateSubject } from './use-deactivate-subject'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDeactivateSubject', () => {
  beforeEach(() => {
    vi.mocked(deactivateSubject).mockReset()
  })

  it('invalidates the subjects list on success', async () => {
    vi.mocked(deactivateSubject).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeactivateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('subj-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'subjects'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(deactivateSubject).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeactivateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('subj-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
