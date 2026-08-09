import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { reactivateGradingPeriod } from './reactivate-grading-period'

describe('reactivateGradingPeriod', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('sets is_active to true for the given grading period', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grading_periods') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await reactivateGradingPeriod('gp-1')

    expect(builder.update).toHaveBeenCalledWith({ is_active: true })
    expect(builder.eq).toHaveBeenCalledWith('id', 'gp-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(reactivateGradingPeriod('gp-1')).rejects.toThrow('boom')
  })
})
