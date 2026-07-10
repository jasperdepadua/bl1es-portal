import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { setSectionAdviser } from './set-section-adviser'

describe('setSectionAdviser', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('updates the section row adviser_id', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'sections') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await setSectionAdviser({ sectionId: 'section-1', adviserId: 'teacher-1' })

    expect(builder.update).toHaveBeenCalledWith({ adviser_id: 'teacher-1' })
    expect(builder.eq).toHaveBeenCalledWith('id', 'section-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(
      setSectionAdviser({ sectionId: 'section-1', adviserId: 'teacher-1' }),
    ).rejects.toThrow('boom')
  })
})
