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
vi.mock('../api/list-teacher-accounts', () => ({ listTeacherAccounts: vi.fn() }))
vi.mock('../api/register-user', () => ({ registerTeacher: vi.fn(), registerStudent: vi.fn() }))
vi.mock('../api/update-teacher', () => ({ updateTeacher: vi.fn() }))
vi.mock('../api/deactivate-teacher', () => ({ deactivateTeacher: vi.fn() }))
vi.mock('../api/reactivate-teacher', () => ({ reactivateTeacher: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { listTeacherAccounts } from '../api/list-teacher-accounts'
import { registerTeacher } from '../api/register-user'
import { updateTeacher } from '../api/update-teacher'
import { deactivateTeacher } from '../api/deactivate-teacher'
import { reactivateTeacher } from '../api/reactivate-teacher'
import TeachersPage from './TeachersPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/teachers']}>
        <AuthProvider>
          <TeachersPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const teacherRows = [
  {
    id: 't-1',
    firstName: 'Ana',
    lastName: 'Reyes',
    name: 'Ana Reyes',
    contactEmail: 'ana@school.test',
    username: 'ana.reyes',
    isActive: true,
    adviserOf: [{ sectionId: 'sec-1', label: 'Kinder–Masaya' }],
    subjectsTaught: [{ subjectId: 'subj-1', sectionId: 'sec-2', label: 'MAPEH · Grade 4–Rizal' }],
  },
  {
    id: 't-2',
    firstName: 'Ben',
    lastName: 'Cruz',
    name: 'Ben Cruz',
    contactEmail: null,
    username: 'ben.cruz',
    isActive: false,
    adviserOf: [],
    subjectsTaught: [],
  },
]

describe('TeachersPage', () => {
  beforeEach(() => {
    vi.mocked(listTeacherAccounts).mockReset()
    vi.mocked(registerTeacher).mockReset()
    vi.mocked(updateTeacher).mockReset()
    vi.mocked(deactivateTeacher).mockReset()
    vi.mocked(reactivateTeacher).mockReset()
  })

  it('shows the empty state when there are no teachers yet', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No teachers yet')).toBeInTheDocument()
  })

  it('renders each teacher with adviser-of/subjects-taught chips and status', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)

    renderPage()

    expect(await screen.findByText('Ana Reyes')).toBeInTheDocument()
    expect(screen.getByText('ana@school.test')).toBeInTheDocument()
    expect(screen.getByText('ana.reyes')).toBeInTheDocument()
    expect(screen.getByText('Kinder–Masaya')).toBeInTheDocument()
    expect(screen.getByText('MAPEH · Grade 4–Rizal')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    expect(screen.getByText('Ben Cruz')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getAllByText('Unassigned')).toHaveLength(2)
  })

  it("shows an error message when teachers fail to load", async () => {
    vi.mocked(listTeacherAccounts).mockRejectedValue(new Error('network error'))

    renderPage()

    await waitFor(() => expect(screen.getByText(/couldn.t load teachers/i)).toBeInTheDocument())
  })

  it('does not show a deactivate action for an already-inactive teacher', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)

    renderPage()

    await screen.findByText('Ana Reyes')

    expect(screen.getByRole('button', { name: 'Deactivate Ana Reyes' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deactivate Ben Cruz' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activate Ben Cruz' })).toBeInTheDocument()
  })

  it('auto-suggests a username from the name fields until hand-edited, then registers and shows the invite-sent success dialog with no credentials shown', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)
    vi.mocked(registerTeacher).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Ana Reyes')
    await user.click(screen.getByRole('button', { name: 'Add Teacher' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Teacher' })
    await user.type(within(dialog).getByLabelText('First Name'), 'Maria')
    await user.type(within(dialog).getByLabelText('Last Name'), 'Santos')

    expect(within(dialog).getByLabelText('Username')).toHaveValue('maria.santos')

    // Hand-editing the username stops further auto-suggestion.
    await user.clear(within(dialog).getByLabelText('Username'))
    await user.type(within(dialog).getByLabelText('Username'), 'msantos')
    await user.type(within(dialog).getByLabelText('Last Name'), 'z')
    expect(within(dialog).getByLabelText('Username')).toHaveValue('msantos')

    await user.clear(within(dialog).getByLabelText('Username'))
    await user.type(within(dialog).getByLabelText('Username'), 'maria.santos')
    await user.type(within(dialog).getByLabelText('Contact Email'), 'maria.santos@example.com')

    await user.click(within(dialog).getByRole('button', { name: 'Send Invite' }))

    await waitFor(() =>
      expect(vi.mocked(registerTeacher).mock.calls[0]?.[0]).toEqual({
        firstName: 'Maria',
        lastName: 'Santosz',
        username: 'maria.santos',
        contactEmail: 'maria.santos@example.com',
      }),
    )

    const successDialog = await screen.findByRole('dialog', { name: 'Invite Sent' })
    expect(within(successDialog).getByText('maria.santos@example.com')).toBeInTheDocument()

    // No password/credential text anywhere in the DOM at this point.
    expect(screen.queryByText(/password/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/credential/i)).not.toBeInTheDocument()

    await user.click(within(successDialog).getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a validation error when required fields are left blank', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Ana Reyes')
    await user.click(screen.getByRole('button', { name: 'Add Teacher' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Teacher' })
    await user.click(within(dialog).getByRole('button', { name: 'Send Invite' }))

    expect(await screen.findByText('First name is required')).toBeInTheDocument()
    expect(registerTeacher).not.toHaveBeenCalled()
  })

  it('opens the edit dialog pre-filled and saves the updated fields', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)
    vi.mocked(updateTeacher).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Ana Reyes')
    await user.click(screen.getByRole('button', { name: 'Edit Ana Reyes' }))

    const dialog = await screen.findByRole('dialog', { name: 'Edit Teacher' })
    expect(within(dialog).getByLabelText('First Name')).toHaveValue('Ana')
    expect(within(dialog).getByLabelText('Last Name')).toHaveValue('Reyes')
    expect(within(dialog).getByLabelText('Contact Email')).toHaveValue('ana@school.test')
    expect(within(dialog).queryByLabelText('Username')).not.toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Contact Email'))
    await user.type(within(dialog).getByLabelText('Contact Email'), 'ana.reyes@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(vi.mocked(updateTeacher).mock.calls[0]?.[0]).toEqual({
        id: 't-1',
        firstName: 'Ana',
        lastName: 'Reyes',
        contactEmail: 'ana.reyes@example.com',
      }),
    )
  })

  it('deactivates a teacher after confirming', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)
    vi.mocked(deactivateTeacher).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Ana Reyes')
    await user.click(screen.getByRole('button', { name: 'Deactivate Ana Reyes' }))

    const confirmDialog = await screen.findByRole('dialog', { name: 'Deactivate Teacher?' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Deactivate' }))

    await waitFor(() => expect(vi.mocked(deactivateTeacher).mock.calls[0]?.[0]).toBe('t-1'))
  })

  it('reactivates an inactive teacher with a single click, no confirmation', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)
    vi.mocked(reactivateTeacher).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Ben Cruz')
    await user.click(screen.getByRole('button', { name: 'Activate Ben Cruz' }))

    await waitFor(() => expect(vi.mocked(reactivateTeacher).mock.calls[0]?.[0]).toBe('t-2'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an inline error below the row when reactivation fails', async () => {
    vi.mocked(listTeacherAccounts).mockResolvedValue(teacherRows)
    vi.mocked(reactivateTeacher).mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Ben Cruz')
    await user.click(screen.getByRole('button', { name: 'Activate Ben Cruz' }))

    expect(
      await screen.findByText("Couldn't reactivate this teacher. Please try again."),
    ).toBeInTheDocument()
  })
})
