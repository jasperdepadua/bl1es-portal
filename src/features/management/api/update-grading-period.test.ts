import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { updateGradingPeriod } from './update-grading-period'

describe('updateGradingPeriod', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('updates the grading period row by id', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grading_periods') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await updateGradingPeriod({
      id: 'gp-1',
      label: 'Term 1',
      sequence: 1,
      startDate: '2026-06-01',
      endDate: '2026-09-30',
    })

    expect(builder.update).toHaveBeenCalledWith({
      label: 'Term 1',
      sequence: 1,
      start_date: '2026-06-01',
      end_date: '2026-09-30',
    })
    expect(builder.eq).toHaveBeenCalledWith('id', 'gp-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))

    await expect(
      updateGradingPeriod({
        id: 'gp-1',
        label: 'Term 1',
        sequence: 1,
        startDate: null,
        endDate: null,
      }),
    ).rejects.toThrow('boom')
  })
})
