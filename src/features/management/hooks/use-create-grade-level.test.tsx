import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/create-grade-level', () => ({ createGradeLevel: vi.fn() }))

import { createGradeLevel } from '../api/create-grade-level'
import { useCreateGradeLevel } from './use-create-grade-level'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCreateGradeLevel', () => {
  beforeEach(() => {
    vi.mocked(createGradeLevel).mockReset()
  })

  it('invalidates the grade levels list on success', async () => {
    vi.mocked(createGradeLevel).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateGradeLevel(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ name: 'Grade 7', sequence: 8 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'grade-levels'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(createGradeLevel).mockRejectedValue(new Error('duplicate name'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateGradeLevel(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ name: 'Grade 7', sequence: 8 })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
