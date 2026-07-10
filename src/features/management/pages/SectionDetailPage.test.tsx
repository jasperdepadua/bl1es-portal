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

vi.mock('../api/get-section-detail', () => ({ getSectionDetail: vi.fn() }))
vi.mock('../api/get-section-roster', () => ({ getSectionRoster: vi.fn() }))
vi.mock('../api/get-section-subject-teachers', () => ({ getSectionSubjectTeachers: vi.fn() }))
vi.mock('../api/list-enrollable-students', () => ({ listEnrollableStudents: vi.fn() }))
vi.mock('../api/enroll-student', () => ({ enrollStudent: vi.fn() }))
vi.mock('../api/unenroll-student', () => ({ unenrollStudent: vi.fn() }))
vi.mock('../api/list-teachers', () => ({ listTeachers: vi.fn() }))
vi.mock('../api/set-section-adviser', () => ({ setSectionAdviser: vi.fn() }))
vi.mock('../api/assign-subject-teacher', () => ({ assignSubjectTeacher: vi.fn() }))

import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { getSectionDetail } from '../api/get-section-detail'
import type { SectionDetail } from '../api/get-section-detail'
import { getSectionRoster } from '../api/get-section-roster'
import { getSectionSubjectTeachers } from '../api/get-section-subject-teachers'
import { listEnrollableStudents } from '../api/list-enrollable-students'
import { enrollStudent } from '../api/enroll-student'
import SectionDetailPage from './SectionDetailPage'

const baseSection: SectionDetail = {
  id: 'section-1',
  name: 'Matulungin',
  gradeLevelId: 'gl-1',
  gradeLevelName: 'Grade 1',
  schoolYearId: 'sy-1',
  schoolYearLabel: '2026-2027',
  shift: 'AM',
  adviserId: 'teacher-1',
  adviserName: 'Ana Reyes',
  adviserContactEmail: 'ana@school.test',
  enrolledCount: 2,
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/management/sections/section-1']}>
        <AuthProvider>
          <Routes>
            <Route path="/management/sections/:sectionId" element={<SectionDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SectionDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getSectionDetail).mockReset()
    vi.mocked(getSectionRoster).mockReset()
    vi.mocked(getSectionSubjectTeachers).mockReset()
    vi.mocked(listEnrollableStudents).mockReset()
    vi.mocked(enrollStudent).mockReset()

    vi.mocked(getSectionDetail).mockResolvedValue(baseSection)
    vi.mocked(getSectionSubjectTeachers).mockResolvedValue([])
  })

  it('shows a "section not found" message when the section fails to load', async () => {
    vi.mocked(getSectionDetail).mockRejectedValue(new Error('not found'))

    renderPage()

    expect(
      await screen.findByText('It may have been removed, or the link is incorrect.'),
    ).toBeInTheDocument()
  })

  it('renders the empty roster state when nobody is enrolled yet', async () => {
    vi.mocked(getSectionRoster).mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No students enrolled yet')).toBeInTheDocument()
  })

  it('renders the roster table when students are enrolled', async () => {
    vi.mocked(getSectionRoster).mockResolvedValue([
      {
        enrollmentId: 'enr-1',
        studentId: 'stu-1',
        studentName: 'Zack Reyes',
        studentNumber: 'bl1es-2026-0001',
        guardianName: 'Rosa Reyes',
        isActive: true,
      },
      {
        enrollmentId: 'enr-2',
        studentId: 'stu-2',
        studentName: 'Amy Cruz',
        studentNumber: 'bl1es-2026-0002',
        guardianName: null,
        isActive: false,
      },
    ])

    renderPage()

    expect(await screen.findByText('Zack Reyes')).toBeInTheDocument()
    expect(screen.getByText('Amy Cruz')).toBeInTheDocument()
    expect(screen.queryByText('No students enrolled yet')).not.toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('shows the "no discrete subjects" empty state for a grade level with no subjects (Kinder)', async () => {
    vi.mocked(getSectionRoster).mockResolvedValue([])
    vi.mocked(getSectionDetail).mockResolvedValue({ ...baseSection, gradeLevelName: 'Kinder' })
    vi.mocked(getSectionSubjectTeachers).mockResolvedValue([])
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('tab', { name: /subject teachers/i }))

    expect(await screen.findByText('No separate subjects for Kinder')).toBeInTheDocument()
  })

  it('lists subject-teacher assignments when the grade level has discrete subjects', async () => {
    vi.mocked(getSectionRoster).mockResolvedValue([])
    vi.mocked(getSectionSubjectTeachers).mockResolvedValue([
      {
        subjectId: 'subj-1',
        subjectName: 'English',
        assignmentId: 'assign-1',
        teacherId: 'teacher-2',
        teacherName: 'Ben Cruz',
      },
      { subjectId: 'subj-2', subjectName: 'Math', assignmentId: null, teacherId: null, teacherName: null },
    ])
    const user = userEvent.setup()

    renderPage()

    await user.click(await screen.findByRole('tab', { name: /subject teachers/i }))

    expect(await screen.findByText('English')).toBeInTheDocument()
    expect(screen.getByText('Ben Cruz')).toBeInTheDocument()
    expect(screen.getByText('Math')).toBeInTheDocument()
    expect(screen.getByText('Unassigned — defaults to adviser')).toBeInTheDocument()
    expect(screen.queryByText(/no discrete subjects/i)).not.toBeInTheDocument()
  })

  it('enrolling a student calls enrollStudent with this section, year, and the chosen student, then closes the dialog', async () => {
    vi.mocked(getSectionRoster).mockResolvedValue([
      {
        enrollmentId: 'enr-1',
        studentId: 'stu-1',
        studentName: 'Zack Reyes',
        studentNumber: 'bl1es-2026-0001',
        guardianName: null,
        isActive: true,
      },
    ])
    vi.mocked(listEnrollableStudents).mockResolvedValue([
      { id: 'stu-3', name: 'Carla Cruz', studentNumber: 'bl1es-2026-0003' },
    ])
    vi.mocked(enrollStudent).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderPage()

    await screen.findByText('Zack Reyes')
    await user.click(screen.getByRole('button', { name: /enroll student/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Enroll Student' })
    await user.click(await within(dialog).findByText('Carla Cruz'))

    await waitFor(() =>
      expect(enrollStudent).toHaveBeenCalledWith(
        { sectionId: 'section-1', schoolYearId: 'sy-1', studentId: 'stu-3' },
        expect.anything(),
      ),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Enroll Student' })).not.toBeInTheDocument(),
    )
  })
})
