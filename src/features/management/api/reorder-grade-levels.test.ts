import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { reorderGradeLevels } from './reorder-grade-levels'

describe('reorderGradeLevels', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('swaps sequence values between the two grade levels', async () => {
    const builders: ReturnType<typeof createQueryBuilder>[] = []
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grade_levels') throw new Error(`Unexpected table: ${table}`)
      const builder = createQueryBuilder({ error: null })
      builders.push(builder)
      return builder
    })

    await reorderGradeLevels({
      firstId: 'gl-1',
      firstSequence: 2,
      secondId: 'gl-2',
      secondSequence: 1,
    })

    expect(builders).toHaveLength(2)
    expect(builders[0].update).toHaveBeenCalledWith({ sequence: 1 })
    expect(builders[0].eq).toHaveBeenCalledWith('id', 'gl-1')
    expect(builders[1].update).toHaveBeenCalledWith({ sequence: 2 })
    expect(builders[1].eq).toHaveBeenCalledWith('id', 'gl-2')
  })

  it('throws when the first update fails and does not attempt the second', async () => {
    let calls = 0
    fromMock.mockImplementation(() => {
      calls += 1
      return createQueryBuilder({ error: new Error('boom') })
    })

    await expect(
      reorderGradeLevels({
        firstId: 'gl-1',
        firstSequence: 2,
        secondId: 'gl-2',
        secondSequence: 1,
      }),
    ).rejects.toThrow('boom')
    expect(calls).toBe(1)
  })

  it('throws when the second update fails', async () => {
    let calls = 0
    fromMock.mockImplementation(() => {
      calls += 1
      return createQueryBuilder({ error: calls === 1 ? null : new Error('boom') })
    })

    await expect(
      reorderGradeLevels({
        firstId: 'gl-1',
        firstSequence: 2,
        secondId: 'gl-2',
        secondSequence: 1,
      }),
    ).rejects.toThrow('boom')
    expect(calls).toBe(2)
  })
})
