import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/reactivate-student', () => ({ reactivateStudent: vi.fn() }))

import { reactivateStudent } from '../api/reactivate-student'
import { useReactivateStudent } from './use-reactivate-student'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useReactivateStudent', () => {
  beforeEach(() => {
    vi.mocked(reactivateStudent).mockReset()
  })

  it('invalidates the student-accounts list on success', async () => {
    vi.mocked(reactivateStudent).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateStudent(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('s-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'students', 'accounts'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(reactivateStudent).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReactivateStudent(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('s-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
