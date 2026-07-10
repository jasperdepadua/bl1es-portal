import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './features/auth/hooks/use-auth'

const { onAuthStateChange, getSession } = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  getSession: vi.fn(async () => ({ data: { session: null } })),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { onAuthStateChange, getSession } } }))

function renderApp(initialEntry: string) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('redirects unauthenticated users from / to the login page', async () => {
    renderApp('/')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /sign in to your portal/i }),
      ).toBeInTheDocument(),
    )
  })

  it('redirects unauthenticated users away from protected routes', async () => {
    renderApp('/dashboard')
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /sign in to your portal/i }),
      ).toBeInTheDocument(),
    )
  })
})
