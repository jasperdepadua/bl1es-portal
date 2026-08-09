import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/create-section', () => ({ createSection: vi.fn() }))

import { createSection } from '../api/create-section'
import { useCreateSection } from './use-create-section'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCreateSection', () => {
  beforeEach(() => {
    vi.mocked(createSection).mockReset()
  })

  it('invalidates the sections list on success', async () => {
    vi.mocked(createSection).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateSection(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ name: 'Mabini', gradeLevelId: 'gl-1', schoolYearId: 'sy-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'sections'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(1)
  })

  it('does not invalidate any cache on failure', async () => {
    vi.mocked(createSection).mockRejectedValue(new Error('duplicate name'))
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateSection(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ name: 'Mabini', gradeLevelId: 'gl-1', schoolYearId: 'sy-1' })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
