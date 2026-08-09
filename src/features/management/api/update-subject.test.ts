import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { updateSubject } from './update-subject'

describe('updateSubject', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('updates the name and adds newly-selected grade levels without touching unchanged ones', async () => {
    const subjectsBuilder = createQueryBuilder({ error: null })
    const currentBuilder = createQueryBuilder({
      data: [{ grade_level_id: 'gl-1' }],
      error: null,
    })
    const insertBuilder = createQueryBuilder({ error: null })
    let joinCallCount = 0
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return subjectsBuilder
      if (table === 'grade_level_subjects') {
        joinCallCount += 1
        return joinCallCount === 1 ? currentBuilder : insertBuilder
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    await updateSubject({ id: 'subj-1', name: 'Mathematics', gradeLevelIds: ['gl-1', 'gl-2'] })

    expect(subjectsBuilder.update).toHaveBeenCalledWith({ name: 'Mathematics' })
    expect(subjectsBuilder.eq).toHaveBeenCalledWith('id', 'subj-1')
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      { subject_id: 'subj-1', grade_level_id: 'gl-2' },
    ])
    expect(insertBuilder.delete).not.toHaveBeenCalled()
  })

  it('removes deselected grade levels without inserting anything new', async () => {
    const subjectsBuilder = createQueryBuilder({ error: null })
    const currentBuilder = createQueryBuilder({
      data: [{ grade_level_id: 'gl-1' }, { grade_level_id: 'gl-2' }],
      error: null,
    })
    const deleteBuilder = createQueryBuilder({ error: null })
    let joinCallCount = 0
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return subjectsBuilder
      if (table === 'grade_level_subjects') {
        joinCallCount += 1
        return joinCallCount === 1 ? currentBuilder : deleteBuilder
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    await updateSubject({ id: 'subj-1', name: 'Mathematics', gradeLevelIds: ['gl-1'] })

    expect(deleteBuilder.delete).toHaveBeenCalled()
    expect(deleteBuilder.eq).toHaveBeenCalledWith('subject_id', 'subj-1')
    expect(deleteBuilder.in).toHaveBeenCalledWith('grade_level_id', ['gl-2'])
    expect(deleteBuilder.insert).not.toHaveBeenCalled()
  })

  it('does nothing to the join table when the selection is unchanged', async () => {
    const subjectsBuilder = createQueryBuilder({ error: null })
    const currentBuilder = createQueryBuilder({
      data: [{ grade_level_id: 'gl-1' }],
      error: null,
    })
    let joinCallCount = 0
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return subjectsBuilder
      if (table === 'grade_level_subjects') {
        joinCallCount += 1
        return currentBuilder
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    await updateSubject({ id: 'subj-1', name: 'Mathematics', gradeLevelIds: ['gl-1'] })

    // Only the read of current assignments — no delete/insert calls follow.
    expect(joinCallCount).toBe(1)
  })

  it('throws when the name update fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return createQueryBuilder({ error: new Error('duplicate name') })
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(
      updateSubject({ id: 'subj-1', name: 'Mathematics', gradeLevelIds: [] }),
    ).rejects.toThrow('duplicate name')
  })

  it('treats an empty current-assignments result as no rows to remove', async () => {
    const subjectsBuilder = createQueryBuilder({ error: null })
    const currentBuilder = createQueryBuilder({ data: null, error: null })
    let joinCallCount = 0
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return subjectsBuilder
      if (table === 'grade_level_subjects') {
        joinCallCount += 1
        return currentBuilder
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    await updateSubject({ id: 'subj-1', name: 'Mathematics', gradeLevelIds: [] })

    expect(joinCallCount).toBe(1)
  })
})
