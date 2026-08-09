import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/reactivate-teacher', () => ({ reactivateTeacher: vi.fn() }))

import { reactivateTeacher } from '../api/reactivate-teacher'
import { useReactivateTeacher } from './use-reactivate-teacher'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useReactivateTeacher', () => {
  beforeEach(() => {
    vi.mocked(reactivateTeacher).mockReset()
  })

  it('invalidates the teacher-accounts list on success', async () => {
    vi.mocked(reactivateTeacher).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateTeacher(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('t-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'teachers', 'accounts'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(reactivateTeacher).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateTeacher(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('t-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
