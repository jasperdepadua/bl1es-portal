import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { createSubject } from './create-subject'

describe('createSubject', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('inserts the subject, then assigns each selected grade level', async () => {
    const subjectsBuilder = createQueryBuilder({ data: { id: 'subj-1' }, error: null })
    const joinBuilder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return subjectsBuilder
      if (table === 'grade_level_subjects') return joinBuilder
      throw new Error(`Unexpected table: ${table}`)
    })

    await createSubject({ name: 'Mathematics', gradeLevelIds: ['gl-1', 'gl-2'] })

    expect(subjectsBuilder.insert).toHaveBeenCalledWith({ name: 'Mathematics' })
    expect(joinBuilder.insert).toHaveBeenCalledWith([
      { subject_id: 'subj-1', grade_level_id: 'gl-1' },
      { subject_id: 'subj-1', grade_level_id: 'gl-2' },
    ])
  })

  it('skips the join-table insert when no grade levels are selected (e.g. Kinder)', async () => {
    const subjectsBuilder = createQueryBuilder({ data: { id: 'subj-1' }, error: null })
    let joinTableQueried = false
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return subjectsBuilder
      if (table === 'grade_level_subjects') {
        joinTableQueried = true
        return createQueryBuilder({ error: null })
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    await createSubject({ name: 'Thematic Learning', gradeLevelIds: [] })

    expect(joinTableQueried).toBe(false)
  })

  it('throws when the subject insert fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return createQueryBuilder({ error: new Error('duplicate name') })
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(createSubject({ name: 'Mathematics', gradeLevelIds: [] })).rejects.toThrow(
      'duplicate name',
    )
  })

  it('throws when the grade-level assignment insert fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return createQueryBuilder({ data: { id: 'subj-1' }, error: null })
      if (table === 'grade_level_subjects') return createQueryBuilder({ error: new Error('boom') })
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(createSubject({ name: 'Mathematics', gradeLevelIds: ['gl-1'] })).rejects.toThrow(
      'boom',
    )
  })
})
