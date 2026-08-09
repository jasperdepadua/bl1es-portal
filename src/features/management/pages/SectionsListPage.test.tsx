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
vi.mock('../api/list-grade-levels', () => ({ listGradeLevels: vi.fn() }))
vi.mock('../api/list-school-years', () => ({ listSchoolYears: vi.fn() }))
vi.mock('../api/create-section', () => ({ createSection: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { listSections } from '../api/list-sections'
import { listGradeLevels } from '../api/list-grade-levels'
import { listSchoolYears } from '../api/list-school-years'
import { createSection } from '../api/create-section'
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
    vi.mocked(listGradeLevels).mockReset().mockResolvedValue([
      { id: 'gl-1', name: 'Kinder', sequence: 1, isActive: true },
      { id: 'gl-2', name: 'Grade 1', sequence: 2, isActive: true },
    ])
    vi.mocked(listSchoolYears).mockReset().mockResolvedValue([
      { id: 'sy-1', label: '2026-2027', startDate: '2026-06-01', endDate: '2027-03-31', isCurrent: true },
    ])
    vi.mocked(createSection).mockReset()
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

  it('opens the create dialog and submits a new section', async () => {
    vi.mocked(listSections).mockResolvedValue([])
    vi.mocked(createSection).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('No sections yet')
    await user.click(screen.getAllByRole('button', { name: 'Add Section' })[0]!)

    const dialog = await screen.findByRole('dialog', { name: 'Add Section' })
    await user.type(screen.getByLabelText('Name'), 'Mabini')
    await user.selectOptions(screen.getByLabelText('Grade Level'), 'gl-2')
    await user.selectOptions(screen.getByLabelText('School Year'), 'sy-1')
    await user.selectOptions(screen.getByLabelText(/Shift/), 'AM')

    await user.click(
      screen.getAllByRole('button', { name: 'Add Section' }).find((b) => dialog.contains(b))!,
    )

    await waitFor(() =>
      expect(vi.mocked(createSection).mock.calls[0]?.[0]).toEqual({
        name: 'Mabini',
        gradeLevelId: 'gl-2',
        schoolYearId: 'sy-1',
        shift: 'AM',
      }),
    )
  })

  it('shows a validation error when required fields are left blank', async () => {
    vi.mocked(listSections).mockResolvedValue([])
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('No sections yet')
    await user.click(screen.getAllByRole('button', { name: 'Add Section' })[0]!)

    const dialog = await screen.findByRole('dialog', { name: 'Add Section' })
    await user.click(
      screen.getAllByRole('button', { name: 'Add Section' }).find((b) => dialog.contains(b))!,
    )

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(createSection).not.toHaveBeenCalled()
  })
})
