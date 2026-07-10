import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/set-section-adviser', () => ({ setSectionAdviser: vi.fn() }))

import { setSectionAdviser } from '../api/set-section-adviser'
import { useSetSectionAdviser } from './use-set-section-adviser'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSetSectionAdviser', () => {
  beforeEach(() => {
    vi.mocked(setSectionAdviser).mockReset()
  })

  it('invalidates the sections list and this section on success', async () => {
    vi.mocked(setSectionAdviser).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useSetSectionAdviser('section-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ sectionId: 'section-1', adviserId: 'teacher-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'sections'], exact: true })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['management', 'sections', 'section-1'] })
    expect(invalidateSpy).toHaveBeenCalledTimes(2)
  })
})
