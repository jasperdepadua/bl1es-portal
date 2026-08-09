import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { createSection } from './create-section'

describe('createSection', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('inserts a new section row', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'sections') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await createSection({
      name: 'Mabini',
      gradeLevelId: 'gl-1',
      schoolYearId: 'sy-1',
      shift: 'AM',
    })

    expect(builder.insert).toHaveBeenCalledWith({
      name: 'Mabini',
      grade_level_id: 'gl-1',
      school_year_id: 'sy-1',
      shift: 'AM',
    })
  })

  it('defaults shift to null when omitted', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation(() => builder)

    await createSection({ name: 'Mabini', gradeLevelId: 'gl-1', schoolYearId: 'sy-1' })

    expect(builder.insert).toHaveBeenCalledWith({
      name: 'Mabini',
      grade_level_id: 'gl-1',
      school_year_id: 'sy-1',
      shift: null,
    })
  })

  it('throws when the insert fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('duplicate name') }))
    await expect(
      createSection({ name: 'Mabini', gradeLevelId: 'gl-1', schoolYearId: 'sy-1' }),
    ).rejects.toThrow('duplicate name')
  })
})
