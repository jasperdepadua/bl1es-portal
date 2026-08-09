import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { reactivateGradeLevel } from './reactivate-grade-level'

describe('reactivateGradeLevel', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('sets is_active to true for the given grade level', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grade_levels') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await reactivateGradeLevel('gl-1')

    expect(builder.update).toHaveBeenCalledWith({ is_active: true })
    expect(builder.eq).toHaveBeenCalledWith('id', 'gl-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(reactivateGradeLevel('gl-1')).rejects.toThrow('boom')
  })
})
