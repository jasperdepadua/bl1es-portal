import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { listStudentAccounts } from './list-student-accounts'

function mockTables(overrides: Record<string, unknown> = {}) {
  const tables: Record<string, unknown> = {
    profiles: [
      { id: 's-1', first_name: 'Amy', last_name: 'Santos', is_active: true },
      { id: 's-2', first_name: 'Bea', last_name: 'Torres', is_active: false },
    ],
    school_years: [{ id: 'sy-1' }],
    student_details: [
      {
        profile_id: 's-1',
        student_number: 'bl1es-2026-0001',
        guardian_name: 'Grace Santos',
        guardian_relationship: 'Mother',
        guardian_contact_number: '0917',
        guardian_email: 'grace@example.com',
        is_4ps_beneficiary: true,
      },
      {
        profile_id: 's-2',
        student_number: 'bl1es-2026-0002',
        guardian_name: null,
        guardian_relationship: null,
        guardian_contact_number: null,
        guardian_email: 'bea-guardian@example.com',
        is_4ps_beneficiary: false,
      },
    ],
    enrollments: [{ student_id: 's-1', section_id: 'sec-1' }],
    sections: [{ id: 'sec-1', name: 'Masaya', grade_level_id: 'gl-1' }],
    grade_levels: [{ id: 'gl-1', name: 'Kinder' }],
    ...overrides,
  }

  fromMock.mockImplementation((table: string) => {
    if (!(table in tables)) throw new Error(`Unexpected table: ${table}`)
    return createQueryBuilder({ data: tables[table], error: null })
  })
}

describe('listStudentAccounts', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('resolves the current-year section label for an enrolled student, and null for one not enrolled', async () => {
    mockTables()

    const result = await listStudentAccounts()

    expect(result.hasCurrentSchoolYear).toBe(true)
    expect(result.students).toEqual([
      {
        id: 's-1',
        firstName: 'Amy',
        lastName: 'Santos',
        name: 'Amy Santos',
        studentNumber: 'bl1es-2026-0001',
        guardianName: 'Grace Santos',
        guardianRelationship: 'Mother',
        guardianContactNumber: '0917',
        guardianEmail: 'grace@example.com',
        is4psBeneficiary: true,
        isActive: true,
        currentSectionLabel: 'Kinder–Masaya',
      },
      {
        id: 's-2',
        firstName: 'Bea',
        lastName: 'Torres',
        name: 'Bea Torres',
        studentNumber: 'bl1es-2026-0002',
        guardianName: null,
        guardianRelationship: null,
        guardianContactNumber: null,
        guardianEmail: 'bea-guardian@example.com',
        is4psBeneficiary: false,
        isActive: false,
        currentSectionLabel: null,
      },
    ])
  })

  it('flags hasCurrentSchoolYear = false and skips the enrollments query entirely when no year is current', async () => {
    mockTables({ school_years: [], enrollments: [], sections: [], grade_levels: [] })

    const result = await listStudentAccounts()

    expect(result.hasCurrentSchoolYear).toBe(false)
    expect(result.students.every((s) => s.currentSectionLabel === null)).toBe(true)
    expect(fromMock.mock.calls.map((c) => c[0])).not.toContain('enrollments')
  })

  it('returns an empty list without querying student_details when there are no students', async () => {
    mockTables({ profiles: [] })

    const result = await listStudentAccounts()

    expect(result.students).toEqual([])
    expect(fromMock.mock.calls.map((c) => c[0]).sort()).toEqual(['profiles', 'school_years'])
  })

  it('throws when the students query fails', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') return createQueryBuilder({ data: null, error: new Error('boom') })
      if (table === 'school_years') return createQueryBuilder({ data: [], error: null })
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(listStudentAccounts()).rejects.toThrow('boom')
  })
})
