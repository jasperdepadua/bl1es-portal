import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
vi.mock('../api/list-grade-levels', () => ({ listGradeLevels: vi.fn() }))
vi.mock('../api/create-grade-level', () => ({ createGradeLevel: vi.fn() }))
vi.mock('../api/update-grade-level', () => ({ updateGradeLevel: vi.fn() }))
vi.mock('../api/deactivate-grade-level', () => ({ deactivateGradeLevel: vi.fn() }))
vi.mock('../api/reorder-grade-levels', () => ({ reorderGradeLevels: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { listGradeLevels } from '../api/list-grade-levels'
import { createGradeLevel } from '../api/create-grade-level'
import { deactivateGradeLevel } from '../api/deactivate-grade-level'
import { reorderGradeLevels } from '../api/reorder-grade-levels'
import GradeLevelsPage from './GradeLevelsPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/grade-levels']}>
        <AuthProvider>
          <GradeLevelsPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const gradeLevelRows = [
  { id: 'gl-1', name: 'Kinder', sequence: 1, isActive: true },
  { id: 'gl-2', name: 'Grade 1', sequence: 2, isActive: true },
  { id: 'gl-3', name: 'Grade 2', sequence: 3, isActive: false },
]

describe('GradeLevelsPage', () => {
  beforeEach(() => {
    vi.mocked(listGradeLevels).mockReset()
    vi.mocked(createGradeLevel).mockReset()
    vi.mocked(deactivateGradeLevel).mockReset()
    vi.mocked(reorderGradeLevels).mockReset()
  })

  it('shows the empty state when there are no grade levels yet', async () => {
    vi.mocked(listGradeLevels).mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No grade levels yet')).toBeInTheDocument()
  })

  it('renders each grade level with its sequence and status', async () => {
    vi.mocked(listGradeLevels).mockResolvedValue(gradeLevelRows)

    renderPage()

    expect(await screen.findByText('Kinder')).toBeInTheDocument()
    expect(screen.getByText('Grade 1')).toBeInTheDocument()
    expect(screen.getByText('Grade 2')).toBeInTheDocument()
    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it("shows an error message when grade levels fail to load", async () => {
    vi.mocked(listGradeLevels).mockRejectedValue(new Error('network error'))

    renderPage()

    await waitFor(() =>
      expect(screen.getByText(/couldn.t load grade levels/i)).toBeInTheDocument(),
    )
  })

  it('disables the up arrow on the first row and the down arrow on the last row', async () => {
    vi.mocked(listGradeLevels).mockResolvedValue(gradeLevelRows)

    renderPage()

    await screen.findByText('Kinder')

    expect(screen.getByRole('button', { name: 'Move Kinder up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Kinder down' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Grade 2 down' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Grade 2 up' })).not.toBeDisabled()
  })

  it('swaps sequences with the neighboring row when a reorder arrow is clicked', async () => {
    vi.mocked(listGradeLevels).mockResolvedValue(gradeLevelRows)
    vi.mocked(reorderGradeLevels).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Kinder')
    await user.click(screen.getByRole('button', { name: 'Move Grade 1 up' }))

    // Assert on the first argument only — TanStack Query v5 passes a second, internal
    // context argument (client/meta/mutationKey) to the mutation function.
    expect(vi.mocked(reorderGradeLevels).mock.calls[0]?.[0]).toEqual({
      firstId: 'gl-2',
      firstSequence: 2,
      secondId: 'gl-1',
      secondSequence: 1,
    })
  })

  it('opens the create dialog and submits a new grade level', async () => {
    vi.mocked(listGradeLevels).mockResolvedValue(gradeLevelRows)
    vi.mocked(createGradeLevel).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Kinder')
    await user.click(screen.getByRole('button', { name: 'Add Grade Level' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Grade Level' })
    await user.type(screen.getByLabelText('Name'), 'Grade 3')
    const sequenceInput = screen.getByLabelText('Sequence')
    await user.clear(sequenceInput)
    await user.type(sequenceInput, '4')

    await user.click(
      screen.getAllByRole('button', { name: 'Add Grade Level' }).find((b) => dialog.contains(b))!,
    )

    await waitFor(() =>
      expect(vi.mocked(createGradeLevel).mock.calls[0]?.[0]).toEqual({
        name: 'Grade 3',
        sequence: 4,
      }),
    )
  })

  it('shows a validation error when the name is left blank', async () => {
    vi.mocked(listGradeLevels).mockResolvedValue(gradeLevelRows)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Kinder')
    await user.click(screen.getByRole('button', { name: 'Add Grade Level' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Grade Level' })
    await user.click(
      screen.getAllByRole('button', { name: 'Add Grade Level' }).find((b) => dialog.contains(b))!,
    )

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(createGradeLevel).not.toHaveBeenCalled()
  })

  it('deactivates a grade level after confirming', async () => {
    vi.mocked(listGradeLevels).mockResolvedValue(gradeLevelRows)
    vi.mocked(deactivateGradeLevel).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Kinder')
    await user.click(screen.getByRole('button', { name: 'Deactivate Kinder' }))

    const confirmDialog = await screen.findByRole('dialog', { name: 'Deactivate Grade Level?' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Deactivate' }))

    await waitFor(() => expect(vi.mocked(deactivateGradeLevel).mock.calls[0]?.[0]).toBe('gl-1'))
  })
})
