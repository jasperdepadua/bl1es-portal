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
vi.mock('../api/list-subjects', () => ({ listSubjects: vi.fn() }))
vi.mock('../api/list-grade-levels', () => ({ listGradeLevels: vi.fn() }))
vi.mock('../api/create-subject', () => ({ createSubject: vi.fn() }))
vi.mock('../api/update-subject', () => ({ updateSubject: vi.fn() }))
vi.mock('../api/deactivate-subject', () => ({ deactivateSubject: vi.fn() }))
vi.mock('../api/reactivate-subject', () => ({ reactivateSubject: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { listSubjects } from '../api/list-subjects'
import { listGradeLevels } from '../api/list-grade-levels'
import { createSubject } from '../api/create-subject'
import { updateSubject } from '../api/update-subject'
import { deactivateSubject } from '../api/deactivate-subject'
import { reactivateSubject } from '../api/reactivate-subject'
import SubjectsPage from './SubjectsPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/subjects']}>
        <AuthProvider>
          <SubjectsPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const gradeLevelRows = [
  { id: 'gl-kinder', name: 'Kinder', sequence: 1, isActive: true },
  { id: 'gl-1', name: 'Grade 1', sequence: 2, isActive: true },
  { id: 'gl-2', name: 'Grade 2', sequence: 3, isActive: false },
]

const subjectRows = [
  {
    id: 'subj-1',
    name: 'Mathematics',
    isActive: true,
    gradeLevels: [
      { id: 'gl-kinder', name: 'Kinder' },
      { id: 'gl-1', name: 'Grade 1' },
    ],
  },
  {
    id: 'subj-2',
    name: 'Filipino',
    isActive: false,
    gradeLevels: [],
  },
]

describe('SubjectsPage', () => {
  beforeEach(() => {
    vi.mocked(listSubjects).mockReset()
    vi.mocked(listGradeLevels).mockReset().mockResolvedValue(gradeLevelRows)
    vi.mocked(createSubject).mockReset()
    vi.mocked(updateSubject).mockReset()
    vi.mocked(deactivateSubject).mockReset()
    vi.mocked(reactivateSubject).mockReset()
  })

  it('shows the empty state when there are no subjects yet', async () => {
    vi.mocked(listSubjects).mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No subjects yet')).toBeInTheDocument()
  })

  it('renders each subject with its status and assigned grade-level chips', async () => {
    vi.mocked(listSubjects).mockResolvedValue(subjectRows)

    renderPage()

    expect(await screen.findByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Kinder')).toBeInTheDocument()
    expect(screen.getByText('Grade 1')).toBeInTheDocument()

    expect(screen.getByText('Filipino')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('No grade levels assigned')).toBeInTheDocument()
  })

  it("shows an error message when subjects fail to load", async () => {
    vi.mocked(listSubjects).mockRejectedValue(new Error('network error'))

    renderPage()

    await waitFor(() => expect(screen.getByText(/couldn.t load subjects/i)).toBeInTheDocument())
  })

  it('does not show a deactivate action for an already-inactive subject', async () => {
    vi.mocked(listSubjects).mockResolvedValue(subjectRows)

    renderPage()

    await screen.findByText('Mathematics')

    expect(screen.getByRole('button', { name: 'Deactivate Mathematics' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deactivate Filipino' })).not.toBeInTheDocument()
  })

  it('opens the create dialog and submits a new subject with selected grade levels', async () => {
    vi.mocked(listSubjects).mockResolvedValue(subjectRows)
    vi.mocked(createSubject).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Add Subject' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Subject' })
    await user.type(within(dialog).getByLabelText('Name'), 'Science')
    await user.click(within(dialog).getByLabelText('Kinder'))

    await user.click(within(dialog).getByRole('button', { name: 'Add Subject' }))

    await waitFor(() =>
      expect(vi.mocked(createSubject).mock.calls[0]?.[0]).toEqual({
        name: 'Science',
        gradeLevelIds: ['gl-kinder'],
      }),
    )
  })

  it('shows a validation error when the name is left blank', async () => {
    vi.mocked(listSubjects).mockResolvedValue(subjectRows)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Add Subject' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Subject' })
    await user.click(within(dialog).getByRole('button', { name: 'Add Subject' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(createSubject).not.toHaveBeenCalled()
  })

  it('opens the edit dialog pre-filled with the current name and grade-level selections', async () => {
    vi.mocked(listSubjects).mockResolvedValue(subjectRows)
    vi.mocked(updateSubject).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Edit Mathematics' }))

    const dialog = await screen.findByRole('dialog', { name: 'Edit Subject' })
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Mathematics')
    expect(within(dialog).getByLabelText('Kinder')).toBeChecked()
    expect(within(dialog).getByLabelText('Grade 1')).toBeChecked()

    // Unassign Kinder from Mathematics.
    await user.click(within(dialog).getByLabelText('Kinder'))
    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(vi.mocked(updateSubject).mock.calls[0]?.[0]).toEqual({
        id: 'subj-1',
        name: 'Mathematics',
        gradeLevelIds: ['gl-1'],
      }),
    )
  })

  it('deactivates a subject after confirming', async () => {
    vi.mocked(listSubjects).mockResolvedValue(subjectRows)
    vi.mocked(deactivateSubject).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Mathematics')
    await user.click(screen.getByRole('button', { name: 'Deactivate Mathematics' }))

    const confirmDialog = await screen.findByRole('dialog', { name: 'Deactivate Subject?' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Deactivate' }))

    await waitFor(() => expect(vi.mocked(deactivateSubject).mock.calls[0]?.[0]).toBe('subj-1'))
  })

  it('shows an inline error below the row when reactivation fails', async () => {
    vi.mocked(listSubjects).mockResolvedValue(subjectRows)
    vi.mocked(reactivateSubject).mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Filipino')
    await user.click(screen.getByRole('button', { name: 'Activate Filipino' }))

    expect(
      await screen.findByText("Couldn't reactivate this subject. Please try again."),
    ).toBeInTheDocument()
  })
})
