import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/create-subject', () => ({ createSubject: vi.fn() }))

import { createSubject } from '../api/create-subject'
import { useCreateSubject } from './use-create-subject'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCreateSubject', () => {
  beforeEach(() => {
    vi.mocked(createSubject).mockReset()
  })

  it('invalidates the subjects list on success', async () => {
    vi.mocked(createSubject).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ name: 'Mathematics', gradeLevelIds: ['gl-1'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'subjects'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(createSubject).mockRejectedValue(new Error('duplicate name'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateSubject(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ name: 'Mathematics', gradeLevelIds: [] })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
