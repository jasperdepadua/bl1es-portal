import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { createGradeLevel } from './create-grade-level'

describe('createGradeLevel', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('inserts a new grade level row', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'grade_levels') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await createGradeLevel({ name: 'Grade 7', sequence: 8 })

    expect(builder.insert).toHaveBeenCalledWith({ name: 'Grade 7', sequence: 8 })
  })

  it('throws when the insert fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('duplicate name') }))
    await expect(createGradeLevel({ name: 'Grade 7', sequence: 8 })).rejects.toThrow(
      'duplicate name',
    )
  })
})
