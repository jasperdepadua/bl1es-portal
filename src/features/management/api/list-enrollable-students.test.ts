import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listEnrollableStudents } from './list-enrollable-students'

describe('listEnrollableStudents', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('excludes students already enrolled this school year — the anti-join enforcing one enrollment per year — and sorts the rest by name', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'enrollments':
          return createQueryBuilder({ data: [{ student_id: 'stu-1' }], error: null })
        case 'profiles':
          return createQueryBuilder({
            data: [
              { id: 'stu-1', first_name: 'Already', last_name: 'Enrolled' },
              { id: 'stu-2', first_name: 'Zack', last_name: 'Reyes' },
              { id: 'stu-3', first_name: 'Amy', last_name: 'Cruz' },
            ],
            error: null,
          })
        case 'student_details':
          return createQueryBuilder({
            data: [
              { profile_id: 'stu-2', student_number: 'bl1es-2026-0002' },
              { profile_id: 'stu-3', student_number: 'bl1es-2026-0003' },
            ],
            error: null,
          })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await listEnrollableStudents('sy-1')

    expect(result).toEqual([
      { id: 'stu-3', name: 'Amy Cruz', studentNumber: 'bl1es-2026-0003' },
      { id: 'stu-2', name: 'Zack Reyes', studentNumber: 'bl1es-2026-0002' },
    ])
  })

  it('returns an empty list without querying student_details when nobody is eligible', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'enrollments':
          return createQueryBuilder({ data: [{ student_id: 'stu-1' }], error: null })
        case 'profiles':
          return createQueryBuilder({
            data: [{ id: 'stu-1', first_name: 'Already', last_name: 'Enrolled' }],
            error: null,
          })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await listEnrollableStudents('sy-1')

    expect(result).toEqual([])
  })

  it('falls back to a null student number when no student_details row exists yet', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'enrollments':
          return createQueryBuilder({ data: [], error: null })
        case 'profiles':
          return createQueryBuilder({ data: [{ id: 'stu-1', first_name: 'New', last_name: 'Student' }], error: null })
        case 'student_details':
          return createQueryBuilder({ data: [], error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await listEnrollableStudents('sy-1')

    expect(result).toEqual([{ id: 'stu-1', name: 'New Student', studentNumber: null }])
  })
})
