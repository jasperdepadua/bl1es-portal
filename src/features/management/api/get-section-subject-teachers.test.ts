import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { getSectionSubjectTeachers } from './get-section-subject-teachers'

describe('getSectionSubjectTeachers', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns an empty list — driven by zero grade_level_subjects rows, not a hardcoded flag — and skips subjects/assignments entirely (the Kinder case)', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'grade_level_subjects') return createQueryBuilder({ data: [], error: null })
      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await getSectionSubjectTeachers({ sectionId: 'section-1', gradeLevelId: 'gl-kinder' })

    expect(result).toEqual([])
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('pairs each subject with its active assignment, leaving subjects with no assignment as unassigned', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'grade_level_subjects':
          return createQueryBuilder({
            data: [{ subject_id: 'subj-1' }, { subject_id: 'subj-2' }],
            error: null,
          })
        case 'subjects':
          return createQueryBuilder({
            data: [
              { id: 'subj-1', name: 'English' },
              { id: 'subj-2', name: 'Math' },
            ],
            error: null,
          })
        case 'subject_assignments':
          return createQueryBuilder({
            data: [{ id: 'assign-1', subject_id: 'subj-1', teacher_id: 'teacher-1' }],
            error: null,
          })
        case 'profiles':
          return createQueryBuilder({
            data: [{ id: 'teacher-1', first_name: 'Ana', last_name: 'Reyes' }],
            error: null,
          })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await getSectionSubjectTeachers({ sectionId: 'section-1', gradeLevelId: 'gl-1' })

    expect(result).toEqual([
      {
        subjectId: 'subj-1',
        subjectName: 'English',
        assignmentId: 'assign-1',
        teacherId: 'teacher-1',
        teacherName: 'Ana Reyes',
      },
      { subjectId: 'subj-2', subjectName: 'Math', assignmentId: null, teacherId: null, teacherName: null },
    ])
  })

  it('skips the teacher lookup when no subject has an active assignment', async () => {
    let profilesQueried = false
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'grade_level_subjects':
          return createQueryBuilder({ data: [{ subject_id: 'subj-1' }], error: null })
        case 'subjects':
          return createQueryBuilder({ data: [{ id: 'subj-1', name: 'English' }], error: null })
        case 'subject_assignments':
          return createQueryBuilder({ data: [], error: null })
        case 'profiles':
          profilesQueried = true
          return createQueryBuilder({ data: [], error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await getSectionSubjectTeachers({ sectionId: 'section-1', gradeLevelId: 'gl-1' })

    expect(profilesQueried).toBe(false)
    expect(result).toEqual([
      { subjectId: 'subj-1', subjectName: 'English', assignmentId: null, teacherId: null, teacherName: null },
    ])
  })
})
