import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { createGradingPeriod } from './create-grading-period'

describe('createGradingPeriod', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('inserts a grading period row, mapping camelCase input to the snake_case schema', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grading_periods') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await createGradingPeriod({
      schoolYearId: 'sy-1',
      label: 'Term 1',
      sequence: 1,
      startDate: '2026-06-01',
      endDate: '2026-09-30',
    })

    expect(builder.insert).toHaveBeenCalledWith({
      school_year_id: 'sy-1',
      label: 'Term 1',
      sequence: 1,
      start_date: '2026-06-01',
      end_date: '2026-09-30',
    })
  })

  it('allows null start/end dates', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation(() => builder)

    await createGradingPeriod({
      schoolYearId: 'sy-1',
      label: 'Term 2',
      sequence: 2,
      startDate: null,
      endDate: null,
    })

    expect(builder.insert).toHaveBeenCalledWith({
      school_year_id: 'sy-1',
      label: 'Term 2',
      sequence: 2,
      start_date: null,
      end_date: null,
    })
  })

  it('throws when the insert fails (e.g. duplicate sequence within the year)', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('duplicate sequence') }))

    await expect(
      createGradingPeriod({
        schoolYearId: 'sy-1',
        label: 'Term 1',
        sequence: 1,
        startDate: null,
        endDate: null,
      }),
    ).rejects.toThrow('duplicate sequence')
  })
})
