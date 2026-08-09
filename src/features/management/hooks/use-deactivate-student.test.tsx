import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/deactivate-student', () => ({ deactivateStudent: vi.fn() }))

import { deactivateStudent } from '../api/deactivate-student'
import { useDeactivateStudent } from './use-deactivate-student'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDeactivateStudent', () => {
  beforeEach(() => {
    vi.mocked(deactivateStudent).mockReset()
  })

  it('invalidates the student-accounts list on success', async () => {
    vi.mocked(deactivateStudent).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeactivateStudent(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('s-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'students', 'accounts'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(deactivateStudent).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeactivateStudent(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('s-1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
