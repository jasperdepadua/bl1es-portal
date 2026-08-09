import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))
vi.mock('@/features/auth/hooks/use-auth', () => ({ useAuth: useAuthMock }))

vi.mock('@/features/auth/api/set-invite-password', () => ({ setInvitePassword: vi.fn() }))

import { setInvitePassword } from '@/features/auth/api/set-invite-password'
import AcceptInvitePage from './AcceptInvitePage'

const fakeSession = { user: { id: 'user-1' } } as unknown as Session

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/accept-invite']}>
        <Routes>
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/dashboard" element={<div>dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AcceptInvitePage', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    vi.mocked(setInvitePassword).mockReset()
    window.history.replaceState(null, '', '/accept-invite')
  })

  it('shows a loading state while the session is still resolving', () => {
    useAuthMock.mockReturnValue({ session: null, isAuthenticated: false, isLoading: true })

    renderPage()

    expect(screen.getByText(/setting up your account/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
  })

  it('shows the invalid-link message with the specific reason when no session and an error param is present', () => {
    window.history.replaceState(
      null,
      '',
      '/accept-invite#error=access_denied&error_description=Email+link+is+invalid+or+has+expired',
    )
    useAuthMock.mockReturnValue({ session: null, isAuthenticated: false, isLoading: false })

    renderPage()

    expect(
      screen.getByText('Email link is invalid or has expired'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Login' })).toBeInTheDocument()
  })

  it('shows a generic invalid-link message when no session and no error param is present', () => {
    useAuthMock.mockReturnValue({ session: null, isAuthenticated: false, isLoading: false })

    renderPage()

    expect(
      screen.getByText('This link is invalid or has already been used.'),
    ).toBeInTheDocument()
  })

  it('renders the set-password form when a session is present', () => {
    useAuthMock.mockReturnValue({ session: fakeSession, isAuthenticated: true, isLoading: false })

    renderPage()

    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
  })

  it('submits the new password and redirects to /dashboard on success', async () => {
    useAuthMock.mockReturnValue({ session: fakeSession, isAuthenticated: true, isLoading: false })
    vi.mocked(setInvitePassword).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await user.type(screen.getByLabelText('Password'), 'a-strong-password')
    await user.type(screen.getByLabelText('Confirm password'), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await waitFor(() =>
      expect(vi.mocked(setInvitePassword).mock.calls[0]?.[0]).toBe('a-strong-password'),
    )
    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())
  })

  it('shows a validation error when the passwords do not match', async () => {
    useAuthMock.mockReturnValue({ session: fakeSession, isAuthenticated: true, isLoading: false })
    const user = userEvent.setup()

    renderPage()

    await user.type(screen.getByLabelText('Password'), 'a-strong-password')
    await user.type(screen.getByLabelText('Confirm password'), 'a-different-password')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(setInvitePassword).not.toHaveBeenCalled()
  })

  it('shows the mutation error above the form and lets the user retry without resetting the session', async () => {
    useAuthMock.mockReturnValue({ session: fakeSession, isAuthenticated: true, isLoading: false })
    vi.mocked(setInvitePassword).mockRejectedValue(new Error('Password is too weak'))
    const user = userEvent.setup()

    renderPage()

    await user.type(screen.getByLabelText('Password'), 'a-strong-password')
    await user.type(screen.getByLabelText('Confirm password'), 'a-strong-password')
    await user.click(screen.getByRole('button', { name: /set password/i }))

    expect(await screen.findByText('Password is too weak')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
