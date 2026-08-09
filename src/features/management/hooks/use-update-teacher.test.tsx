import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/update-teacher', () => ({ updateTeacher: vi.fn() }))

import { updateTeacher } from '../api/update-teacher'
import { useUpdateTeacher } from './use-update-teacher'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUpdateTeacher', () => {
  beforeEach(() => {
    vi.mocked(updateTeacher).mockReset()
  })

  it('invalidates the teacher-accounts list on success', async () => {
    vi.mocked(updateTeacher).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateTeacher(), { wrapper: createWrapper(queryClient) })

    result.current.mutate({ id: 't-1', firstName: 'Ana', lastName: 'Reyes', contactEmail: 'a@x.com' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'teachers', 'accounts'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(updateTeacher).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateTeacher(), { wrapper: createWrapper(queryClient) })

    result.current.mutate({ id: 't-1', firstName: 'Ana', lastName: 'Reyes', contactEmail: 'a@x.com' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
