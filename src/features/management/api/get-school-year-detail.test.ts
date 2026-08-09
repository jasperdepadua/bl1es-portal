import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { getSchoolYearDetail } from './get-school-year-detail'

describe('getSchoolYearDetail', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('assembles the school year and its grading periods, sorted by sequence', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'school_years':
          return createQueryBuilder({
            data: {
              id: 'sy-1',
              label: '2026-2027',
              start_date: '2026-06-01',
              end_date: '2027-03-31',
              is_current: true,
            },
            error: null,
          })
        case 'grading_periods':
          return createQueryBuilder({
            data: [
              {
                id: 'gp-1',
                label: 'Term 1',
                sequence: 1,
                start_date: '2026-06-01',
                end_date: '2026-09-30',
                is_active: true,
              },
              {
                id: 'gp-2',
                label: 'Term 2',
                sequence: 2,
                start_date: '2026-10-01',
                end_date: '2027-01-15',
                is_active: false,
              },
            ],
            error: null,
          })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await getSchoolYearDetail('sy-1')

    expect(result).toEqual({
      id: 'sy-1',
      label: '2026-2027',
      startDate: '2026-06-01',
      endDate: '2027-03-31',
      isCurrent: true,
      gradingPeriods: [
        {
          id: 'gp-1',
          label: 'Term 1',
          sequence: 1,
          startDate: '2026-06-01',
          endDate: '2026-09-30',
          isActive: true,
        },
        {
          id: 'gp-2',
          label: 'Term 2',
          sequence: 2,
          startDate: '2026-10-01',
          endDate: '2027-01-15',
          isActive: false,
        },
      ],
    })
  })

  it('returns an empty grading-periods array when none exist yet', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'school_years':
          return createQueryBuilder({
            data: {
              id: 'sy-1',
              label: '2026-2027',
              start_date: '2026-06-01',
              end_date: '2027-03-31',
              is_current: false,
            },
            error: null,
          })
        case 'grading_periods':
          return createQueryBuilder({ data: [], error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await getSchoolYearDetail('sy-1')

    expect(result.gradingPeriods).toEqual([])
  })

  it('throws when the school year lookup fails', async () => {
    fromMock.mockImplementation(() =>
      createQueryBuilder({ data: null, error: new Error('not found') }),
    )
    await expect(getSchoolYearDetail('missing')).rejects.toThrow('not found')
  })

  it('throws when the grading periods lookup fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'school_years') {
        return createQueryBuilder({
          data: {
            id: 'sy-1',
            label: '2026-2027',
            start_date: '2026-06-01',
            end_date: '2027-03-31',
            is_current: false,
          },
          error: null,
        })
      }
      return createQueryBuilder({ data: null, error: new Error('boom') })
    })

    await expect(getSchoolYearDetail('sy-1')).rejects.toThrow('boom')
  })
})
