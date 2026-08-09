import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listSchoolYears } from './list-school-years'

describe('listSchoolYears', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('maps school year rows to list items, newest first', async () => {
    const builder = createQueryBuilder({
      data: [
        {
          id: 'sy-2',
          label: '2027-2028',
          start_date: '2027-06-01',
          end_date: '2028-03-31',
          is_current: false,
        },
        {
          id: 'sy-1',
          label: '2026-2027',
          start_date: '2026-06-01',
          end_date: '2027-03-31',
          is_current: true,
        },
      ],
      error: null,
    })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'school_years') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    const result = await listSchoolYears()

    expect(builder.order).toHaveBeenCalledWith('start_date', { ascending: false })
    expect(result).toEqual([
      {
        id: 'sy-2',
        label: '2027-2028',
        startDate: '2027-06-01',
        endDate: '2028-03-31',
        isCurrent: false,
      },
      {
        id: 'sy-1',
        label: '2026-2027',
        startDate: '2026-06-01',
        endDate: '2027-03-31',
        isCurrent: true,
      },
    ])
  })

  it('returns an empty array when there are no school years yet', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ data: null, error: null }))
    expect(await listSchoolYears()).toEqual([])
  })

  it('throws when the query fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ data: null, error: new Error('boom') }))
    await expect(listSchoolYears()).rejects.toThrow('boom')
  })
})
