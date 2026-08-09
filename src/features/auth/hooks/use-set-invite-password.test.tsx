import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/set-invite-password', () => ({ setInvitePassword: vi.fn() }))

import { setInvitePassword } from '../api/set-invite-password'
import { useSetInvitePassword } from './use-set-invite-password'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSetInvitePassword', () => {
  beforeEach(() => {
    vi.mocked(setInvitePassword).mockReset()
  })

  it('calls setInvitePassword with the given password and reports success', async () => {
    vi.mocked(setInvitePassword).mockResolvedValue(undefined)
    const queryClient = new QueryClient()

    const { result } = renderHook(() => useSetInvitePassword(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('a-strong-password')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(vi.mocked(setInvitePassword).mock.calls[0]?.[0]).toBe('a-strong-password')
  })

  it('surfaces the mutation error on failure', async () => {
    vi.mocked(setInvitePassword).mockRejectedValue(new Error('Password too short'))
    const queryClient = new QueryClient()

    const { result } = renderHook(() => useSetInvitePassword(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('short')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Password too short')
  })
})
