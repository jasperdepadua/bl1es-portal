import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/set-current-school-year', () => ({ setCurrentSchoolYear: vi.fn() }))

import { setCurrentSchoolYear } from '../api/set-current-school-year'
import { useSetCurrentSchoolYear } from './use-set-current-school-year'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSetCurrentSchoolYear', () => {
  beforeEach(() => {
    vi.mocked(setCurrentSchoolYear).mockReset()
  })

  it('calls setCurrentSchoolYear with the year id and invalidates the list and this year on success', async () => {
    vi.mocked(setCurrentSchoolYear).mockResolvedValue(undefined)
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useSetCurrentSchoolYear('sy-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('sy-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(setCurrentSchoolYear).toHaveBeenCalledWith('sy-1', expect.anything())
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['management', 'school-years'],
      exact: true,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['management', 'school-years', 'sy-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledTimes(2)
  })
})
