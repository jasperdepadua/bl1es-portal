import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listSections } from './list-sections'

describe('listSections', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('joins grade level, school year, adviser, and enrolled-count data for each section', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'sections':
          return createQueryBuilder({
            data: [
              {
                id: 'sec-1',
                name: 'Matulungin',
                grade_level_id: 'gl-1',
                school_year_id: 'sy-1',
                adviser_id: 'teacher-1',
              },
              {
                id: 'sec-2',
                name: 'Masaya',
                grade_level_id: 'gl-2',
                school_year_id: 'sy-1',
                adviser_id: null,
              },
            ],
            error: null,
          })
        case 'grade_levels':
          return createQueryBuilder({
            data: [
              { id: 'gl-1', name: 'Grade 1' },
              { id: 'gl-2', name: 'Kinder' },
            ],
            error: null,
          })
        case 'school_years':
          return createQueryBuilder({ data: [{ id: 'sy-1', label: '2026-2027' }], error: null })
        case 'enrollments':
          return createQueryBuilder({
            data: [{ section_id: 'sec-1' }, { section_id: 'sec-1' }, { section_id: 'sec-2' }],
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

    const result = await listSections()

    expect(result).toEqual([
      {
        id: 'sec-1',
        name: 'Matulungin',
        gradeLevelName: 'Grade 1',
        schoolYearLabel: '2026-2027',
        adviserName: 'Ana Reyes',
        enrolledCount: 2,
      },
      {
        id: 'sec-2',
        name: 'Masaya',
        gradeLevelName: 'Kinder',
        schoolYearLabel: '2026-2027',
        adviserName: null,
        enrolledCount: 1,
      },
    ])
  })

  it('skips the adviser lookup when no section has one assigned', async () => {
    let profilesQueried = false
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'sections':
          return createQueryBuilder({
            data: [
              { id: 'sec-1', name: 'Masaya', grade_level_id: 'gl-1', school_year_id: 'sy-1', adviser_id: null },
            ],
            error: null,
          })
        case 'grade_levels':
          return createQueryBuilder({ data: [{ id: 'gl-1', name: 'Kinder' }], error: null })
        case 'school_years':
          return createQueryBuilder({ data: [{ id: 'sy-1', label: '2026-2027' }], error: null })
        case 'enrollments':
          return createQueryBuilder({ data: [], error: null })
        case 'profiles':
          profilesQueried = true
          return createQueryBuilder({ data: [], error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await listSections()

    expect(profilesQueried).toBe(false)
    expect(result[0].adviserName).toBeNull()
    expect(result[0].enrolledCount).toBe(0)
  })

  it('falls back to placeholder labels when a grade level or school year id has no match', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'sections':
          return createQueryBuilder({
            data: [
              {
                id: 'sec-1',
                name: 'Orphan',
                grade_level_id: 'gl-missing',
                school_year_id: 'sy-missing',
                adviser_id: null,
              },
            ],
            error: null,
          })
        case 'grade_levels':
          return createQueryBuilder({ data: [], error: null })
        case 'school_years':
          return createQueryBuilder({ data: [], error: null })
        case 'enrollments':
          return createQueryBuilder({ data: [], error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await listSections()

    expect(result[0].gradeLevelName).toBe('Unknown grade level')
    expect(result[0].schoolYearLabel).toBe('Unknown school year')
  })
})
