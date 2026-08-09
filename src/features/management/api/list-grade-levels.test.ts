import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listGradeLevels } from './list-grade-levels'

describe('listGradeLevels', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('maps grade level rows ordered by sequence', async () => {
    const builder = createQueryBuilder({
      data: [
        { id: 'gl-1', name: 'Kinder', sequence: 1, is_active: true },
        { id: 'gl-2', name: 'Grade 1', sequence: 2, is_active: false },
      ],
      error: null,
    })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grade_levels') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    const result = await listGradeLevels()

    expect(builder.select).toHaveBeenCalledWith('id, name, sequence, is_active')
    expect(builder.order).toHaveBeenCalledWith('sequence', { ascending: true })
    expect(result).toEqual([
      { id: 'gl-1', name: 'Kinder', sequence: 1, isActive: true },
      { id: 'gl-2', name: 'Grade 1', sequence: 2, isActive: false },
    ])
  })

  it('throws when the query fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(listGradeLevels()).rejects.toThrow('boom')
  })

  it('returns an empty array when there is no data', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ data: null, error: null }))
    await expect(listGradeLevels()).resolves.toEqual([])
  })
})
