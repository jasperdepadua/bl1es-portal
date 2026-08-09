import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listSubjects } from './list-subjects'

describe('listSubjects', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('joins each subject with the grade levels assigned to it, in sequence order', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'subjects':
          return createQueryBuilder({
            data: [
              { id: 'subj-1', name: 'Mathematics', is_active: true },
              { id: 'subj-2', name: 'English', is_active: false },
            ],
            error: null,
          })
        case 'grade_levels':
          return createQueryBuilder({
            data: [
              { id: 'gl-kinder', name: 'Kinder' },
              { id: 'gl-1', name: 'Grade 1' },
              { id: 'gl-2', name: 'Grade 2' },
            ],
            error: null,
          })
        case 'grade_level_subjects':
          return createQueryBuilder({
            data: [
              { subject_id: 'subj-1', grade_level_id: 'gl-2' },
              { subject_id: 'subj-1', grade_level_id: 'gl-1' },
            ],
            error: null,
          })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await listSubjects()

    expect(result).toEqual([
      {
        id: 'subj-1',
        name: 'Mathematics',
        isActive: true,
        gradeLevels: [
          { id: 'gl-1', name: 'Grade 1' },
          { id: 'gl-2', name: 'Grade 2' },
        ],
      },
      {
        id: 'subj-2',
        name: 'English',
        isActive: false,
        gradeLevels: [],
      },
    ])
  })

  it('returns an empty grade-level list for a subject with no assignments (e.g. Kinder-only curriculum)', async () => {
    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'subjects':
          return createQueryBuilder({
            data: [{ id: 'subj-1', name: 'Mathematics', is_active: true }],
            error: null,
          })
        case 'grade_levels':
          return createQueryBuilder({ data: [{ id: 'gl-kinder', name: 'Kinder' }], error: null })
        case 'grade_level_subjects':
          return createQueryBuilder({ data: [], error: null })
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const result = await listSubjects()

    expect(result[0].gradeLevels).toEqual([])
  })

  it('throws when the subjects query fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'subjects') return createQueryBuilder({ error: new Error('boom') })
      return createQueryBuilder({ data: [], error: null })
    })

    await expect(listSubjects()).rejects.toThrow('boom')
  })
})
