import { render, screen, waitFor, within } from '@testing-library/react'
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
vi.mock('../api/list-school-years', () => ({ listSchoolYears: vi.fn() }))
vi.mock('../api/create-school-year', () => ({ createSchoolYear: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { listSchoolYears } from '../api/list-school-years'
import { createSchoolYear } from '../api/create-school-year'
import SchoolYearsListPage from './SchoolYearsListPage'

function DetailProbe() {
  const { schoolYearId } = useParams<{ schoolYearId: string }>()
  return <div>School year detail for {schoolYearId}</div>
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/school-years']}>
        <AuthProvider>
          <Routes>
            <Route path="/management/school-years" element={<SchoolYearsListPage />} />
            <Route path="/management/school-years/:schoolYearId" element={<DetailProbe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SchoolYearsListPage', () => {
  beforeEach(() => {
    vi.mocked(listSchoolYears).mockReset()
    vi.mocked(createSchoolYear).mockReset()
  })

  it('shows the empty state when there are no school years yet', async () => {
    vi.mocked(listSchoolYears).mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No school years yet')).toBeInTheDocument()
  })

  it('renders each school year with its dates and current badge', async () => {
    vi.mocked(listSchoolYears).mockResolvedValue([
      { id: 'sy-1', label: '2026-2027', startDate: '2026-06-01', endDate: '2027-03-31', isCurrent: true },
      { id: 'sy-2', label: '2025-2026', startDate: '2025-06-01', endDate: '2026-03-31', isCurrent: false },
    ])

    renderPage()

    expect(await screen.findByText('2026-2027')).toBeInTheDocument()
    expect(screen.getByText('2025-2026')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('navigates to the school year detail page when a row is activated', async () => {
    vi.mocked(listSchoolYears).mockResolvedValue([
      { id: 'sy-1', label: '2026-2027', startDate: '2026-06-01', endDate: '2027-03-31', isCurrent: true },
    ])
    const user = userEvent.setup()

    renderPage()

    const row = await screen.findByRole('link', { name: /view 2026-2027/i })
    await user.click(row)

    expect(await screen.findByText('School year detail for sy-1')).toBeInTheDocument()
  })

  it('shows an error message when school years fail to load', async () => {
    vi.mocked(listSchoolYears).mockRejectedValue(new Error('network error'))

    renderPage()

    await waitFor(() =>
      expect(screen.getByText(/couldn.t load school years/i)).toBeInTheDocument(),
    )
  })

  it('creates a school year from the Add School Year dialog and closes it on success', async () => {
    vi.mocked(listSchoolYears).mockResolvedValue([])
    vi.mocked(createSchoolYear).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('No school years yet')
    await user.click(screen.getAllByRole('button', { name: /add school year/i })[0])

    const dialog = await screen.findByRole('dialog', { name: 'Add School Year' })
    await user.type(screen.getByLabelText('Label'), '2026-2027')
    await user.type(screen.getByLabelText('Start Date'), '2026-06-01')
    await user.type(screen.getByLabelText('End Date'), '2027-03-31')
    await user.click(within(dialog).getByRole('button', { name: /^add school year$/i }))

    await waitFor(() =>
      expect(createSchoolYear).toHaveBeenCalledWith(
        {
          label: '2026-2027',
          startDate: '2026-06-01',
          endDate: '2027-03-31',
        },
        expect.anything(),
      ),
    )
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
  })

  it('shows a validation error when the end date is not after the start date', async () => {
    vi.mocked(listSchoolYears).mockResolvedValue([])
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('No school years yet')
    await user.click(screen.getAllByRole('button', { name: /add school year/i })[0])

    const dialog = await screen.findByRole('dialog', { name: 'Add School Year' })
    await user.type(screen.getByLabelText('Label'), '2026-2027')
    await user.type(screen.getByLabelText('Start Date'), '2026-06-01')
    await user.type(screen.getByLabelText('End Date'), '2026-01-01')
    await user.click(within(dialog).getByRole('button', { name: /^add school year$/i }))

    expect(await screen.findByText('End date must be after start date')).toBeInTheDocument()
    expect(createSchoolYear).not.toHaveBeenCalled()
  })
})
