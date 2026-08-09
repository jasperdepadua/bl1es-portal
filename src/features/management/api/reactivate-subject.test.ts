import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryBuilder } from '@/test/mock-query-builder'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: fromMock } }))

import { reactivateSubject } from './reactivate-subject'

describe('reactivateSubject', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('sets is_active to true for the given subject', async () => {
    const builder = createQueryBuilder({ error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'subjects') throw new Error(`Unexpected table: ${table}`)
      return builder
    })

    await reactivateSubject('subj-1')

    expect(builder.update).toHaveBeenCalledWith({ is_active: true })
    expect(builder.eq).toHaveBeenCalledWith('id', 'subj-1')
  })

  it('throws when the update fails', async () => {
    fromMock.mockImplementation(() => createQueryBuilder({ error: new Error('boom') }))
    await expect(reactivateSubject('subj-1')).rejects.toThrow('boom')
  })
})
