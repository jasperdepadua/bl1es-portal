import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'

const { onAuthStateChange, getSession, signOut } = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange, getSession, signOut } },
}))

vi.mock('@/features/auth/api/get-current-profile', () => ({ getCurrentProfile: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { getCurrentProfile } from '@/features/auth/api/get-current-profile'
import { RequireAuth } from './require-auth'

const fakeSession = { user: { id: 'user-1' } } as unknown as Session

function LoginStub() {
  const location = useLocation()
  const state = location.state as { deactivated?: boolean } | null
  return <div>login page{state?.deactivated ? ' (deactivated)' : ''}</div>
}

function renderWithRoutes() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginStub />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<div>dashboard content</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RequireAuth', () => {
  let authStateCallback: ((event: string, session: Session | null) => void) | undefined

  beforeEach(() => {
    onAuthStateChange.mockReset().mockImplementation((cb: typeof authStateCallback) => {
      authStateCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    getSession.mockReset()
    signOut.mockReset().mockResolvedValue({ error: null })
    vi.mocked(getCurrentProfile).mockReset()
  })

  it('redirects to /login when there is no session', async () => {
    getSession.mockResolvedValue({ data: { session: null } })

    renderWithRoutes()

    await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument())
  })

  it('renders the protected content when authenticated with a visible profile', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: 'user-1',
      role: 'normal',
      firstName: 'Ana',
      lastName: 'Reyes',
      username: 'ana.reyes',
    })

    renderWithRoutes()

    await waitFor(() => expect(screen.getByText('dashboard content')).toBeInTheDocument())
  })

  it('signs out and redirects to /login with a deactivated flag when the profile resolves to null', async () => {
    getSession.mockResolvedValue({ data: { session: fakeSession } })
    vi.mocked(getCurrentProfile).mockResolvedValue(null)

    renderWithRoutes()

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))

    // Simulate the real signOut() clearing the session via onAuthStateChange.
    authStateCallback?.('SIGNED_OUT', null)

    await waitFor(() =>
      expect(screen.getByText('login page (deactivated)')).toBeInTheDocument(),
    )
  })
})
