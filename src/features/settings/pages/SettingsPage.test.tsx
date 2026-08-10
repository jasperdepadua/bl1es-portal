import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { onAuthStateChange, getSession } = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  getSession: vi.fn(async () => ({
    data: { session: { user: { id: 'user-1' } } },
  })),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { onAuthStateChange, getSession } } }))

vi.mock('@/features/auth/api/get-current-profile', () => ({ getCurrentProfile: vi.fn() }))
vi.mock('@/features/auth/api/sign-out', () => ({ signOut: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { getCurrentProfile } from '@/features/auth/api/get-current-profile'
import SettingsPage from './SettingsPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/settings']}>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentProfile).mockReset()
  })

  it('binds the First Name / Last Name fields to the real signed-in profile', async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      firstName: 'Ana',
      lastName: 'Cruz',
      username: 'ana.cruz',
    })

    renderPage()

    await waitFor(() => expect(screen.getByLabelText('First Name')).toHaveValue('Ana'))
    expect(screen.getByLabelText('Last Name')).toHaveValue('Cruz')
    expect(screen.queryByDisplayValue('Maria')).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('Reyes')).not.toBeInTheDocument()
  })

  it('leaves fields with no real data source empty with a placeholder', async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      firstName: 'Ana',
      lastName: 'Cruz',
      username: 'ana.cruz',
    })

    renderPage()

    await waitFor(() => expect(screen.getByLabelText('First Name')).toHaveValue('Ana'))
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Email')).toHaveAttribute('placeholder', 'Not set yet')
    expect(screen.getByLabelText('Contact Number')).toHaveValue('')
    expect(screen.queryByDisplayValue(/m\.reyes@bl1es\.edu\.ph/i)).not.toBeInTheDocument()
  })

  it('shows a visible notice explaining editing is not available, and disables Save/Cancel/photo', async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      firstName: 'Ana',
      lastName: 'Cruz',
      username: 'ana.cruz',
    })

    renderPage()

    await waitFor(() => expect(screen.getByLabelText('First Name')).toHaveValue('Ana'))
    expect(
      screen.getByText(/editing your profile isn.t available yet/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Change photo' })).toBeDisabled()
  })
})
