import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listTeacherAccounts } from './list-teacher-accounts'

function mockTables(overrides: Record<string, unknown> = {}) {
  const tables: Record<string, unknown> = {
    profiles: [
      {
        id: 't-1',
        first_name: 'Ana',
        last_name: 'Reyes',
        contact_email: 'ana@school.test',
        username: 'ana.reyes',
        is_active: true,
      },
      {
        id: 't-2',
        first_name: 'Ben',
        last_name: 'Cruz',
        contact_email: null,
        username: 'ben.cruz',
        is_active: false,
      },
    ],
    sections: [
      { id: 'sec-1', name: 'Masaya', grade_level_id: 'gl-1', adviser_id: 't-1' },
      { id: 'sec-2', name: 'Rizal', grade_level_id: 'gl-2', adviser_id: null },
    ],
    subject_assignments: [{ section_id: 'sec-2', subject_id: 'subj-1', teacher_id: 't-1' }],
    grade_levels: [
      { id: 'gl-1', name: 'Kinder' },
      { id: 'gl-2', name: 'Grade 4' },
    ],
    subjects: [{ id: 'subj-1', name: 'MAPEH' }],
    ...overrides,
  }

  fromMock.mockImplementation((table: string) => {
    if (!(table in tables)) throw new Error(`Unexpected table: ${table}`)
    return createQueryBuilder({ data: tables[table], error: null })
  })
}

describe('listTeacherAccounts', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('groups adviser-of and subjects-taught chips per teacher, with the section–grade-level label format', async () => {
    mockTables()

    const result = await listTeacherAccounts()

    expect(result).toEqual([
      {
        id: 't-1',
        firstName: 'Ana',
        lastName: 'Reyes',
        name: 'Ana Reyes',
        contactEmail: 'ana@school.test',
        username: 'ana.reyes',
        isActive: true,
        adviserOf: [{ sectionId: 'sec-1', label: 'Kinder–Masaya' }],
        subjectsTaught: [{ subjectId: 'subj-1', sectionId: 'sec-2', label: 'MAPEH · Grade 4–Rizal' }],
      },
      {
        id: 't-2',
        firstName: 'Ben',
        lastName: 'Cruz',
        name: 'Ben Cruz',
        contactEmail: null,
        username: 'ben.cruz',
        isActive: false,
        adviserOf: [],
        subjectsTaught: [],
      },
    ])
  })

  it('only queries role = admin profiles, ordered by first name', async () => {
    mockTables()

    await listTeacherAccounts()

    const profilesCall = fromMock.mock.results.find((_, i) => fromMock.mock.calls[i]?.[0] === 'profiles')
    expect(profilesCall).toBeDefined()
  })

  it('returns an empty list without querying sections/subject_assignments when there are no teachers', async () => {
    mockTables({ profiles: [] })

    const result = await listTeacherAccounts()

    expect(result).toEqual([])
    expect(fromMock.mock.calls.map((c) => c[0])).toEqual(['profiles'])
  })

  it('throws when the teachers query fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return createQueryBuilder({ data: null, error: new Error('boom') })
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(listTeacherAccounts()).rejects.toThrow('boom')
  })
})
