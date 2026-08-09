import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { deactivateSubject } from './deactivate-subject'

describe('deactivateSubject', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('sets is_active to false for the given subject, leaving grade-level assignments untouched', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'subjects') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await deactivateSubject('subj-1')

    expect(builder.update).toHaveBeenCalledWith({ is_active: false })
    expect(builder.eq).toHaveBeenCalledWith('id', 'subj-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(deactivateSubject('subj-1')).rejects.toThrow('boom')
  })
})
