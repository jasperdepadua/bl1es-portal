import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { getSectionRoster } from './get-section-roster'

describe('getSectionRoster', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns an empty roster without querying profiles or student_details when nobody is enrolled', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'enrollments') return createQueryBuilder({ data: [], error: null })
      throw new Error(`Unexpected table: ${table}`)
    })

    const result = await getSectionRoster('section-1')

    expect(result).toEqual([])
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('joins profile and student_details data, sorted by student name, with fallbacks for missing details', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'enrollments':
          return createQueryBuilder({
            data: [
              { id: 'enr-1', student_id: 'stu-1' },
              { id: 'enr-2', student_id: 'stu-2' },
            ],
            error: null,
          })
        case 'profiles':
          return createQueryBuilder({
            data: [
              { id: 'stu-1', first_name: 'Zack', last_name: 'Reyes', is_active: true },
              { id: 'stu-2', first_name: 'Amy', last_name: 'Cruz', is_active: false },
            ],
            error: null,
          })
        case 'student_details':
          return createQueryBuilder({
            data: [
              { profile_id: 'stu-1', student_number: 'bl1es-2026-0001', guardian_name: 'Rosa Reyes' },
            ],
            error: null,
          })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await getSectionRoster('section-1')

    expect(result).toEqual([
      {
        enrollmentId: 'enr-2',
        studentId: 'stu-2',
        studentName: 'Amy Cruz',
        studentNumber: '—',
        guardianName: null,
        isActive: false,
      },
      {
        enrollmentId: 'enr-1',
        studentId: 'stu-1',
        studentName: 'Zack Reyes',
        studentNumber: 'bl1es-2026-0001',
        guardianName: 'Rosa Reyes',
        isActive: true,
      },
    ])
  })

  it('throws when the enrollments lookup errors', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ data: null, error: new Error('boom') }))
    await expect(getSectionRoster('section-1')).rejects.toThrow('boom')
  })
})
