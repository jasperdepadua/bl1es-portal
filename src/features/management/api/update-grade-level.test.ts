import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { updateGradeLevel } from './update-grade-level'

describe('updateGradeLevel', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('updates the grade level row name and sequence', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grade_levels') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await updateGradeLevel({ id: 'gl-1', name: 'Grade 1', sequence: 2 })

    expect(builder.update).toHaveBeenCalledWith({ name: 'Grade 1', sequence: 2 })
    expect(builder.eq).toHaveBeenCalledWith('id', 'gl-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(
      updateGradeLevel({ id: 'gl-1', name: 'Grade 1', sequence: 2 }),
    ).rejects.toThrow('boom')
  })
})
