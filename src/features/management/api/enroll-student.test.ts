import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { enrollStudent } from './enroll-student'

describe('enrollStudent', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('inserts an enrollment row, mapping camelCase input to the snake_case schema', async () => {
    const insertBuilder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'enrollments') throw new Error(`Unexpected table: ${table}`)
      return insertBuilder
    })

    await enrollStudent({ sectionId: 'section-1', schoolYearId: 'sy-1', studentId: 'stu-1' })

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      student_id: 'stu-1',
      section_id: 'section-1',
      school_year_id: 'sy-1',
    })
  })

  it('throws when the insert fails (e.g. the one-enrollment-per-year constraint)', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('duplicate enrollment') }))

    await expect(
      enrollStudent({ sectionId: 'section-1', schoolYearId: 'sy-1', studentId: 'stu-1' }),
    ).rejects.toThrow('duplicate enrollment')
  })
})
