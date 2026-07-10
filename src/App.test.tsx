import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { AuthProvider } from './features/auth/hooks/use-auth'

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('redirects unauthenticated users from / to the login page', () => {
    renderApp('/')
    expect(
      screen.getByRole('heading', { name: /sign in to your portal/i }),
    ).toBeInTheDocument()
  })

  it('redirects unauthenticated users away from protected routes', () => {
    renderApp('/dashboard')
    expect(
      screen.getByRole('heading', { name: /sign in to your portal/i }),
    ).toBeInTheDocument()
  })
})
