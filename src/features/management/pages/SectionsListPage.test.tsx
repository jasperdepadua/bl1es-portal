import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { onAuthStateChange, getSession } = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  getSession: vi.fn(async () => ({ data: { session: null } })),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { onAuthStateChange, getSession } } }))

vi.mock('@/features/auth/api/get-current-profile', () => ({ getCurrentProfile: vi.fn() }))
vi.mock('@/features/auth/api/sign-out', () => ({ signOut: vi.fn() }))
vi.mock('../api/list-sections', () => ({ listSections: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { listSections } from '../api/list-sections'
import SectionsListPage from './SectionsListPage'

function DetailProbe() {
  const { sectionId } = useParams<{ sectionId: string }>()
  return <div>Section detail for {sectionId}</div>
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/sections']}>
        <AuthProvider>
          <Routes>
            <Route path="/management/sections" element={<SectionsListPage />} />
            <Route path="/management/sections/:sectionId" element={<DetailProbe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SectionsListPage', () => {
  beforeEach(() => {
    vi.mocked(listSections).mockReset()
  })

  it('shows the empty state when there are no sections yet', async () => {
    vi.mocked(listSections).mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No sections yet')).toBeInTheDocument()
  })

  it('renders each section with its grade level, school year, adviser, and enrolled count', async () => {
    vi.mocked(listSections).mockResolvedValue([
      {
        id: 'sec-1',
        name: 'Matulungin',
        gradeLevelName: 'Grade 1',
        schoolYearLabel: '2026-2027',
        adviserName: 'Ana Reyes',
        enrolledCount: 24,
      },
      {
        id: 'sec-2',
        name: 'Masaya',
        gradeLevelName: 'Kinder',
        schoolYearLabel: '2026-2027',
        adviserName: null,
        enrolledCount: 0,
      },
    ])

    renderPage()

    expect(await screen.findByText('Matulungin')).toBeInTheDocument()
    expect(screen.getByText('Ana Reyes')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('Masaya')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('navigates to the section detail page when a row is activated', async () => {
    vi.mocked(listSections).mockResolvedValue([
      {
        id: 'sec-1',
        name: 'Matulungin',
        gradeLevelName: 'Grade 1',
        schoolYearLabel: '2026-2027',
        adviserName: 'Ana Reyes',
        enrolledCount: 24,
      },
    ])
    const user = userEvent.setup()

    renderPage()

    const row = await screen.findByRole('link', { name: /view matulungin/i })
    await user.click(row)

    expect(await screen.findByText('Section detail for sec-1')).toBeInTheDocument()
  })

  it("shows an error message when sections fail to load", async () => {
    vi.mocked(listSections).mockRejectedValue(new Error('network error'))

    renderPage()

    await waitFor(() =>
      expect(screen.getByText(/couldn.t load sections/i)).toBeInTheDocument(),
    )
  })
})
