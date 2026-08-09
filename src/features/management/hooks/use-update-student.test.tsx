import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/update-student', () => ({ updateStudent: vi.fn() }))

import { updateStudent } from '../api/update-student'
import { useUpdateStudent } from './use-update-student'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUpdateStudent', () => {
  beforeEach(() => {
    vi.mocked(updateStudent).mockReset()
  })

  it('invalidates the student-accounts list on success', async () => {
    vi.mocked(updateStudent).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateStudent(), { wrapper: createWrapper(queryClient) })

    result.current.mutate({
      id: 's-1',
      firstName: 'Amy',
      lastName: 'Santos',
      guardianEmail: 'grace@example.com',
      is4psBeneficiary: false,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'students', 'accounts'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(updateStudent).mockRejectedValue(new Error('boom'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateStudent(), { wrapper: createWrapper(queryClient) })

    result.current.mutate({
      id: 's-1',
      firstName: 'Amy',
      lastName: 'Santos',
      guardianEmail: 'grace@example.com',
      is4psBeneficiary: false,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
