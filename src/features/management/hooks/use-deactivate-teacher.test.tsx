import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/deactivate-teacher', () => ({ deactivateTeacher: vi.fn() }))

import { deactivateTeacher } from '../api/deactivate-teacher'
import { useDeactivateTeacher } from './use-deactivate-teacher'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDeactivateTeacher', () => {
  beforeEach(() => {
    vi.mocked(deactivateTeacher).mockReset()
  })

  it('invalidates the teacher-accounts list on success', async () => {
    vi.mocked(deactivateTeacher).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeactivateTeacher(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('t-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'teachers', 'accounts'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(deactivateTeacher).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeactivateTeacher(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('t-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
