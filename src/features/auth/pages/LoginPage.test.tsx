import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LoginPage from './LoginPage'

function renderPage(initialState?: { deactivated?: boolean }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[{ pathname: '/login', state: initialState ?? null }]}
      >
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('does not show the deactivated banner on a normal visit', () => {
    renderPage()

    expect(screen.queryByText(/account has been deactivated/i)).not.toBeInTheDocument()
  })

  it('shows the deactivated banner when redirected with { deactivated: true } state', () => {
    renderPage({ deactivated: true })

    expect(screen.getByRole('alert')).toHaveTextContent(/account has been deactivated/i)
  })
})
