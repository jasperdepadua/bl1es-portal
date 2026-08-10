import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { onAuthStateChange, getSession } = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  getSession: vi.fn(async () => ({ data: { session: null } })),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { onAuthStateChange, getSession } } }))

vi.mock('@/features/auth/api/get-current-profile', () => ({ getCurrentProfile: vi.fn() }))
vi.mock('@/features/auth/api/sign-out', () => ({ signOut: vi.fn() }))

vi.mock('../api/get-school-year-detail', () => ({ getSchoolYearDetail: vi.fn() }))
vi.mock('../api/set-current-school-year', () => ({ setCurrentSchoolYear: vi.fn() }))
vi.mock('../api/create-grading-period', () => ({ createGradingPeriod: vi.fn() }))
vi.mock('../api/update-grading-period', () => ({ updateGradingPeriod: vi.fn() }))
vi.mock('../api/deactivate-grading-period', () => ({ deactivateGradingPeriod: vi.fn() }))
vi.mock('../api/reactivate-grading-period', () => ({ reactivateGradingPeriod: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { getSchoolYearDetail } from '../api/get-school-year-detail'
import type { SchoolYearDetail } from '../api/get-school-year-detail'
import { setCurrentSchoolYear } from '../api/set-current-school-year'
import { createGradingPeriod } from '../api/create-grading-period'
import { deactivateGradingPeriod } from '../api/deactivate-grading-period'
import { reactivateGradingPeriod } from '../api/reactivate-grading-period'
import SchoolYearDetailPage from './SchoolYearDetailPage'

const baseSchoolYear: SchoolYearDetail = {
  id: 'sy-1',
  label: '2026-2027',
  startDate: '2026-06-01',
  endDate: '2027-03-31',
  isCurrent: false,
  gradingPeriods: [],
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/school-years/sy-1']}>
        <AuthProvider>
          <Routes>
            <Route path="/management/school-years/:schoolYearId" element={<SchoolYearDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SchoolYearDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getSchoolYearDetail).mockReset()
    vi.mocked(setCurrentSchoolYear).mockReset()
    vi.mocked(createGradingPeriod).mockReset()
    vi.mocked(deactivateGradingPeriod).mockReset()
    vi.mocked(reactivateGradingPeriod).mockReset()
  })

  it('shows a "school year not found" message when the year fails to load', async () => {
    vi.mocked(getSchoolYearDetail).mockRejectedValue(new Error('not found'))

    renderPage()

    expect(
      await screen.findByText('It may have been removed, or the link is incorrect.'),
    ).toBeInTheDocument()
  })

  it('renders the header with label, date range, and no current badge', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue(baseSchoolYear)

    renderPage()

    expect(await screen.findByText('Jun 1, 2026 – Mar 31, 2027')).toBeInTheDocument()
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /set as current/i })).toBeInTheDocument()
  })

  it('does not show the "Set as Current" action when this year is already current', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue({ ...baseSchoolYear, isCurrent: true })

    renderPage()

    await screen.findByText('Current')
    expect(screen.queryByRole('button', { name: /set as current/i })).not.toBeInTheDocument()
  })

  it('renders the empty grading periods state when none exist yet', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue(baseSchoolYear)

    renderPage()

    expect(await screen.findByText('No grading periods yet')).toBeInTheDocument()
  })

  it('renders grading periods sorted by sequence with active/inactive badges', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue({
      ...baseSchoolYear,
      gradingPeriods: [
        {
          id: 'gp-2',
          label: 'Term 2',
          sequence: 2,
          startDate: '2026-10-01',
          endDate: '2027-01-15',
          isActive: false,
        },
        {
          id: 'gp-1',
          label: 'Term 1',
          sequence: 1,
          startDate: '2026-06-01',
          endDate: '2026-09-30',
          isActive: true,
        },
      ],
    })

    renderPage()

    const rows = await screen.findAllByRole('row')
    // Header row + Term 1 + Term 2, in sequence order.
    expect(rows[1]).toHaveTextContent('Term 1')
    expect(rows[2]).toHaveTextContent('Term 2')
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('setting the year as current calls the mutation with the year id and closes the dialog', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue(baseSchoolYear)
    vi.mocked(setCurrentSchoolYear).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', { name: /set as current/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Set as Current School Year?' })
    await user.click(within(dialog).getByRole('button', { name: /set as current/i }))

    await waitFor(() =>
      expect(setCurrentSchoolYear).toHaveBeenCalledWith('sy-1', expect.anything()),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Set as Current School Year?' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('adding a grading period calls createGradingPeriod with a defaulted sequence and closes the dialog', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue({
      ...baseSchoolYear,
      gradingPeriods: [
        {
          id: 'gp-1',
          label: 'Term 1',
          sequence: 1,
          startDate: null,
          endDate: null,
          isActive: true,
        },
      ],
    })
    vi.mocked(createGradingPeriod).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Term 1')
    await user.click(screen.getAllByRole('button', { name: /add grading period/i })[0])

    const dialog = await screen.findByRole('dialog', { name: 'Add Grading Period' })
    expect(screen.getByLabelText('Sequence')).toHaveValue(2)
    await user.type(screen.getByLabelText('Label'), 'Term 2')
    await user.click(within(dialog).getByRole('button', { name: /^add grading period$/i }))

    await waitFor(() =>
      expect(createGradingPeriod).toHaveBeenCalledWith(
        {
          schoolYearId: 'sy-1',
          label: 'Term 2',
          sequence: 2,
          startDate: null,
          endDate: null,
        },
        expect.anything(),
      ),
    )
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
  })

  it('deactivating a grading period calls deactivateGradingPeriod with its id', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue({
      ...baseSchoolYear,
      gradingPeriods: [
        {
          id: 'gp-1',
          label: 'Term 1',
          sequence: 1,
          startDate: null,
          endDate: null,
          isActive: true,
        },
      ],
    })
    vi.mocked(deactivateGradingPeriod).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', { name: /deactivate term 1/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Deactivate Grading Period?' })
    await user.click(within(dialog).getByRole('button', { name: /^deactivate$/i }))

    await waitFor(() =>
      expect(deactivateGradingPeriod).toHaveBeenCalledWith('gp-1', expect.anything()),
    )
  })

  it('shows an inline error below the row when reactivating a grading period fails', async () => {
    vi.mocked(getSchoolYearDetail).mockResolvedValue({
      ...baseSchoolYear,
      gradingPeriods: [
        {
          id: 'gp-1',
          label: 'Term 1',
          sequence: 1,
          startDate: null,
          endDate: null,
          isActive: false,
        },
      ],
    })
    vi.mocked(reactivateGradingPeriod).mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('button', { name: /activate term 1/i }))

    expect(
      await screen.findByText("Couldn't reactivate this grading period. Please try again."),
    ).toBeInTheDocument()
  })
})
