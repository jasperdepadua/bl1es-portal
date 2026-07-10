import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { getSectionDetail } from './get-section-detail'

describe('getSectionDetail', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('assembles grade level, school year, adviser, and enrolled count for a section with an adviser', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'sections':
          return createQueryBuilder({
            data: {
              id: 'section-1',
              name: 'Matulungin',
              grade_level_id: 'gl-1',
              school_year_id: 'sy-1',
              shift: 'AM',
              adviser_id: 'teacher-1',
            },
            error: null,
          })
        case 'grade_levels':
          return createQueryBuilder({ data: { name: 'Grade 1' }, error: null })
        case 'school_years':
          return createQueryBuilder({ data: { label: '2026-2027' }, error: null })
        case 'profiles':
          return createQueryBuilder({
            data: { first_name: 'Maria', last_name: 'Santos', contact_email: 'maria@school.test' },
            error: null,
          })
        case 'enrollments':
          return createQueryBuilder({ count: 24, error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await getSectionDetail('section-1')

    expect(result).toEqual({
      id: 'section-1',
      name: 'Matulungin',
      gradeLevelId: 'gl-1',
      gradeLevelName: 'Grade 1',
      schoolYearId: 'sy-1',
      schoolYearLabel: '2026-2027',
      shift: 'AM',
      adviserId: 'teacher-1',
      adviserName: 'Maria Santos',
      adviserContactEmail: 'maria@school.test',
      enrolledCount: 24,
    })
  })

  it('skips the adviser lookup and reports null adviser fields when the section has no adviser', async () => {
    let profilesQueried = false
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'sections':
          return createQueryBuilder({
            data: {
              id: 'section-2',
              name: 'Masigla',
              grade_level_id: 'gl-2',
              school_year_id: 'sy-1',
              shift: null,
              adviser_id: null,
            },
            error: null,
          })
        case 'grade_levels':
          return createQueryBuilder({ data: { name: 'Kinder' }, error: null })
        case 'school_years':
          return createQueryBuilder({ data: { label: '2026-2027' }, error: null })
        case 'profiles':
          profilesQueried = true
          return createQueryBuilder({ data: null, error: null })
        case 'enrollments':
          return createQueryBuilder({ count: 0, error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await getSectionDetail('section-2')

    expect(profilesQueried).toBe(false)
    expect(result.adviserId).toBeNull()
    expect(result.adviserName).toBeNull()
    expect(result.adviserContactEmail).toBeNull()
    expect(result.enrolledCount).toBe(0)
  })

  it('throws when the section lookup errors', async () => {
    fromMock.mockImplementation(() =>
      createQueryBuilder({ data: null, error: new Error('not found') }),
    )
    await expect(getSectionDetail('missing')).rejects.toThrow('not found')
  })
})
