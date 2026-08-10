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
vi.mock('../api/list-student-accounts', () => ({ listStudentAccounts: vi.fn() }))
vi.mock('../api/register-user', () => ({ registerTeacher: vi.fn(), registerStudent: vi.fn() }))
vi.mock('../api/update-student', () => ({ updateStudent: vi.fn() }))
vi.mock('../api/deactivate-student', () => ({ deactivateStudent: vi.fn() }))
vi.mock('../api/reactivate-student', () => ({ reactivateStudent: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { listStudentAccounts } from '../api/list-student-accounts'
import { registerStudent } from '../api/register-user'
import { updateStudent } from '../api/update-student'
import { deactivateStudent } from '../api/deactivate-student'
import { reactivateStudent } from '../api/reactivate-student'
import StudentsPage from './StudentsPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/students']}>
        <AuthProvider>
          <StudentsPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const studentRows = [
  {
    id: 's-1',
    firstName: 'Amy',
    lastName: 'Santos',
    name: 'Amy Santos',
    studentNumber: 'bl1es-2026-0001',
    guardianName: 'Grace Santos',
    guardianRelationship: 'Mother',
    guardianContactNumber: '0917',
    guardianEmail: 'grace@example.com',
    is4psBeneficiary: true,
    isActive: true,
    currentSectionLabel: 'Kinder–Masaya',
  },
  {
    id: 's-2',
    firstName: 'Bea',
    lastName: 'Torres',
    name: 'Bea Torres',
    studentNumber: 'bl1es-2026-0002',
    guardianName: null,
    guardianRelationship: null,
    guardianContactNumber: null,
    guardianEmail: 'bea-guardian@example.com',
    is4psBeneficiary: false,
    isActive: false,
    currentSectionLabel: null,
  },
]

describe('StudentsPage', () => {
  beforeEach(() => {
    vi.mocked(listStudentAccounts).mockReset()
    vi.mocked(registerStudent).mockReset()
    vi.mocked(updateStudent).mockReset()
    vi.mocked(deactivateStudent).mockReset()
    vi.mocked(reactivateStudent).mockReset()
  })

  it('shows the empty state when there are no students yet', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({ hasCurrentSchoolYear: true, students: [] })

    renderPage()

    expect(await screen.findByText('No students yet')).toBeInTheDocument()
  })

  it('renders each student with student number, guardian, 4Ps flag, current section, and status', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: true,
      students: studentRows,
    })

    renderPage()

    expect(await screen.findByText('Amy Santos')).toBeInTheDocument()
    expect(screen.getByText('bl1es-2026-0001')).toBeInTheDocument()
    expect(screen.getByText('Grace Santos')).toBeInTheDocument()
    expect(screen.getByText('4Ps')).toBeInTheDocument()
    expect(screen.getByText('Kinder–Masaya')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    expect(screen.getByText('Bea Torres')).toBeInTheDocument()
    expect(screen.getByText('Not enrolled')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('renders "—" for current section (not "Not enrolled") when no school year is current yet', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: false,
      students: [{ ...studentRows[1], currentSectionLabel: null }],
    })

    renderPage()

    await screen.findByText('Bea Torres')
    expect(screen.queryByText('Not enrolled')).not.toBeInTheDocument()
  })

  it("shows an error message when students fail to load", async () => {
    vi.mocked(listStudentAccounts).mockRejectedValue(new Error('network error'))

    renderPage()

    await waitFor(() => expect(screen.getByText(/couldn.t load students/i)).toBeInTheDocument())
  })

  it('registers a student and shows the invite-sent success dialog with no credentials shown', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: true,
      students: studentRows,
    })
    vi.mocked(registerStudent).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Amy Santos')
    await user.click(screen.getByRole('button', { name: 'Add Student' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Student' })
    await user.type(within(dialog).getByLabelText('First Name'), 'Juan')
    await user.type(within(dialog).getByLabelText('Last Name'), 'Dela Cruz')
    await user.type(within(dialog).getByLabelText('Guardian Email'), 'juan.guardian@example.com')
    await user.click(within(dialog).getByLabelText('4Ps Beneficiary'))

    await user.click(within(dialog).getByRole('button', { name: 'Send Invite' }))

    await waitFor(() =>
      expect(vi.mocked(registerStudent).mock.calls[0]?.[0]).toEqual({
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        guardianName: undefined,
        guardianRelationship: undefined,
        guardianContactNumber: undefined,
        guardianEmail: 'juan.guardian@example.com',
        is4psBeneficiary: true,
      }),
    )

    const successDialog = await screen.findByRole('dialog', { name: 'Invite Sent' })
    expect(within(successDialog).getByText('juan.guardian@example.com')).toBeInTheDocument()

    expect(screen.queryByText(/password/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/credential/i)).not.toBeInTheDocument()
  })

  it('shows a validation error when required fields are left blank', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: true,
      students: studentRows,
    })
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Amy Santos')
    await user.click(screen.getByRole('button', { name: 'Add Student' }))

    const dialog = await screen.findByRole('dialog', { name: 'Add Student' })
    await user.click(within(dialog).getByRole('button', { name: 'Send Invite' }))

    expect(await screen.findByText('First name is required')).toBeInTheDocument()
    expect(registerStudent).not.toHaveBeenCalled()
  })

  it('opens the edit dialog pre-filled with guardian info and 4Ps flag, and saves changes', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: true,
      students: studentRows,
    })
    vi.mocked(updateStudent).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Amy Santos')
    await user.click(screen.getByRole('button', { name: 'Edit Amy Santos' }))

    const dialog = await screen.findByRole('dialog', { name: 'Edit Student' })
    expect(within(dialog).getByLabelText('First Name')).toHaveValue('Amy')
    expect(within(dialog).getByLabelText('Guardian Name (optional)')).toHaveValue('Grace Santos')
    expect(within(dialog).getByLabelText('Guardian Email')).toHaveValue('grace@example.com')
    expect(within(dialog).getByLabelText('4Ps Beneficiary')).toBeChecked()

    await user.click(within(dialog).getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(vi.mocked(updateStudent).mock.calls[0]?.[0]).toEqual({
        id: 's-1',
        firstName: 'Amy',
        lastName: 'Santos',
        guardianName: 'Grace Santos',
        guardianRelationship: 'Mother',
        guardianContactNumber: '0917',
        guardianEmail: 'grace@example.com',
        is4psBeneficiary: true,
      }),
    )
  })

  it('deactivates a student after confirming', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: true,
      students: studentRows,
    })
    vi.mocked(deactivateStudent).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Amy Santos')
    await user.click(screen.getByRole('button', { name: 'Deactivate Amy Santos' }))

    const confirmDialog = await screen.findByRole('dialog', { name: 'Deactivate Student?' })
    await user.click(within(confirmDialog).getByRole('button', { name: 'Deactivate' }))

    await waitFor(() => expect(vi.mocked(deactivateStudent).mock.calls[0]?.[0]).toBe('s-1'))
  })

  it('reactivates an inactive student with a single click, no confirmation', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: true,
      students: studentRows,
    })
    vi.mocked(reactivateStudent).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Bea Torres')
    await user.click(screen.getByRole('button', { name: 'Activate Bea Torres' }))

    await waitFor(() => expect(vi.mocked(reactivateStudent).mock.calls[0]?.[0]).toBe('s-2'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an inline error below the row when reactivation fails', async () => {
    vi.mocked(listStudentAccounts).mockResolvedValue({
      hasCurrentSchoolYear: true,
      students: studentRows,
    })
    vi.mocked(reactivateStudent).mockRejectedValue(new Error('network error'))
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Bea Torres')
    await user.click(screen.getByRole('button', { name: 'Activate Bea Torres' }))

    expect(
      await screen.findByText("Couldn't reactivate this student. Please try again."),
    ).toBeInTheDocument()
  })
})
