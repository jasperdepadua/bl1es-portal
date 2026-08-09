import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/update-subject', () => ({ updateSubject: vi.fn() }))

import { updateSubject } from '../api/update-subject'
import { useUpdateSubject } from './use-update-subject'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUpdateSubject', () => {
  beforeEach(() => {
    vi.mocked(updateSubject).mockReset()
  })

  it('invalidates the subjects list on success', async () => {
    vi.mocked(updateSubject).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'subj-1', name: 'Mathematics', gradeLevelIds: ['gl-1'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'subjects'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(updateSubject).mockRejectedValue(new Error('duplicate name'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'subj-1', name: 'Mathematics', gradeLevelIds: [] })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
