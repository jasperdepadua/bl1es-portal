import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { onAuthStateChange, getSession } = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  getSession: vi.fn(async () => ({ data: { session: null } })),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { onAuthStateChange, getSession } } }))

vi.mock('@/features/auth/api/get-current-profile', () => ({ getCurrentProfile: vi.fn() }))
vi.mock('@/features/auth/api/sign-out', () => ({ signOut: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { getCurrentProfile } from '@/features/auth/api/get-current-profile'
import DashboardPage from './DashboardPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getCurrentProfile).mockReset()
  })

  it('disables the not-yet-wired call-to-action buttons instead of leaving them as dead-end clicks', () => {
    renderPage()

    expect(screen.getByRole('button', { name: /view schedule/i })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: /view all/i })).toHaveLength(2)
    screen.getAllByRole('button', { name: /view all/i }).forEach((button) => {
      expect(button).toBeDisabled()
    })
    screen.getAllByRole('button', { name: /mark as done/i }).forEach((button) => {
      expect(button).toBeDisabled()
    })
  })
})
