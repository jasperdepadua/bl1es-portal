import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { deactivateGradingPeriod } from './deactivate-grading-period'

describe('deactivateGradingPeriod', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('soft-deletes the grading period by setting is_active to false', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grading_periods') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await deactivateGradingPeriod('gp-1')

    expect(builder.update).toHaveBeenCalledWith({ is_active: false })
    expect(builder.eq).toHaveBeenCalledWith('id', 'gp-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(deactivateGradingPeriod('gp-1')).rejects.toThrow('boom')
  })
})
