import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { createSchoolYear } from './create-school-year'

describe('createSchoolYear', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('inserts a school year row, mapping camelCase input to the snake_case schema', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'school_years') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await createSchoolYear({ label: '2026-2027', startDate: '2026-06-01', endDate: '2027-03-31' })

    expect(builder.insert).toHaveBeenCalledWith({
      label: '2026-2027',
      start_date: '2026-06-01',
      end_date: '2027-03-31',
    })
  })

  it('throws when the insert fails (e.g. duplicate label)', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('duplicate label') }))

    await expect(
      createSchoolYear({ label: '2026-2027', startDate: '2026-06-01', endDate: '2027-03-31' }),
    ).rejects.toThrow('duplicate label')
  })
})
